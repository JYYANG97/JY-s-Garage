
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RequirementsPanel } from './components/RequirementsPanel';
import { Visualizer } from './components/Visualizer';
import { DesignSpec, UploadedFile, GenerationState, SavedDesign, HistoryItem } from './types';
import { analyzeCADFile, generateDesignConcept } from './services/geminiService';
import { getSavedDesigns, saveDesign, deleteDesign } from './services/storageService';

const App: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [analysisSpec, setAnalysisSpec] = useState<DesignSpec | null>(null);
  const [prompt, setPrompt] = useState<string>(''); // Lifted state
  const [genState, setGenState] = useState<GenerationState>({
    isAnalyzing: false,
    isGenerating: false,
    imageUrl: null,
    error: null
  });
  
  // Session History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Storage State
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);

  useEffect(() => {
    // Load saved designs on mount
    setSavedDesigns(getSavedDesigns());
  }, []);

  const handleFileUpload = async (file: File) => {
    // 1. Convert to Base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = (e.target?.result as string).split(',')[1];
      const mimeType = file.type;
      
      const newFile = {
        data: e.target?.result as string, // keep full data url for preview if image
        mimeType: mimeType,
        name: file.name
      };
      
      setUploadedFile(newFile);
      setAnalysisSpec(null);
      setHistory([]); // Reset history on new file
      setGenState(prev => ({ ...prev, isAnalyzing: true, error: null, imageUrl: null }));

      try {
        // 2. Trigger Analysis
        const analysisText = await analyzeCADFile(base64Data, mimeType);
        
        setAnalysisSpec({
          title: file.name,
          extractedDimensions: [], // Parsed from text in a real app, simplified here
          detectedMaterials: [],
          designFeatures: [],
          rawAnalysis: analysisText
        });
        
        setGenState(prev => ({ ...prev, isAnalyzing: false }));
      } catch (err) {
        setGenState(prev => ({ 
          ...prev, 
          isAnalyzing: false, 
          error: "Failed to analyze file. Please ensure it is a valid PDF or Image." 
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleModify = async (promptText: string) => {
    if (!analysisSpec || !uploadedFile) return;

    setGenState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      // Prepare file data for API (strip prefix)
      const base64Clean = uploadedFile.data.split(',')[1];
      
      const imageUrl = await generateDesignConcept(
        promptText, 
        analysisSpec.rawAnalysis,
        { data: base64Clean, mimeType: uploadedFile.mimeType }
      );

      setGenState(prev => ({
        ...prev,
        isGenerating: false,
        imageUrl: imageUrl
      }));

      // Add to history
      setHistory(prev => [
        {
          id: crypto.randomUUID(),
          prompt: promptText,
          imageUrl: imageUrl,
          timestamp: Date.now()
        },
        ...prev
      ]);

    } catch (err: any) {
      setGenState(prev => ({
        ...prev,
        isGenerating: false,
        error: err.message || "Failed to generate design. Please try again."
      }));
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setGenState(prev => ({
        ...prev,
        imageUrl: item.imageUrl,
        error: null
    }));
    setPrompt(item.prompt);
  };

  // --- Storage Handlers ---

  const handleSave = (name: string, currentPrompt: string) => {
    if (!uploadedFile || !analysisSpec) return;

    const newDesign: SavedDesign = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      uploadedFile,
      analysisSpec,
      modificationPrompt: currentPrompt,
      generatedImageUrl: genState.imageUrl
    };

    try {
      saveDesign(newDesign);
      setSavedDesigns(getSavedDesigns());
    } catch (e: any) {
      alert(e.message || "Failed to save design");
    }
  };

  const handleLoad = (design: SavedDesign) => {
    setUploadedFile(design.uploadedFile);
    setAnalysisSpec(design.analysisSpec);
    setPrompt(design.modificationPrompt);
    // Reset history when loading a saved design (start fresh context) or we could persist it
    setHistory([]); 
    setGenState({
      isAnalyzing: false,
      isGenerating: false,
      imageUrl: design.generatedImageUrl,
      error: null
    });
    
    // If the loaded design has a result, treat it as the first history item
    if (design.generatedImageUrl) {
        setHistory([{
            id: crypto.randomUUID(),
            prompt: design.modificationPrompt,
            imageUrl: design.generatedImageUrl,
            timestamp: Date.now()
        }]);
    }
  };

  const handleDelete = (id: string) => {
    deleteDesign(id);
    setSavedDesigns(getSavedDesigns());
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-full w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] min-h-[600px]">
          {/* Left Panel: Controls */}
          <div className="w-full lg:w-[350px] xl:w-[400px] flex-shrink-0 h-full">
            <RequirementsPanel 
              onFileUpload={handleFileUpload}
              onModify={handleModify}
              analysisSpec={analysisSpec}
              uploadedFile={uploadedFile}
              isAnalyzing={genState.isAnalyzing}
              isGenerating={genState.isGenerating}
              // Storage Props
              savedDesigns={savedDesigns}
              onSave={handleSave}
              onLoad={handleLoad}
              onDelete={handleDelete}
              currentPrompt={prompt}
              onPromptChange={setPrompt}
            />
          </div>

          {/* Right Panel: Visualization */}
          <div className="flex-1 h-full min-w-0">
             <Visualizer 
                isLoading={genState.isGenerating}
                generatedImageUrl={genState.imageUrl}
                uploadedFile={uploadedFile}
                error={genState.error}
                history={history}
                onSelectHistory={handleSelectHistory}
             />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

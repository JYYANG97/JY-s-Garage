import React, { useState, useRef, useEffect } from 'react';
import { DesignSpec, UploadedFile, SavedDesign } from '../types';

interface RequirementsPanelProps {
  onFileUpload: (file: File) => void;
  onModify: (prompt: string) => void;
  analysisSpec: DesignSpec | null;
  uploadedFile: UploadedFile | null;
  isAnalyzing: boolean;
  isGenerating: boolean;
  // New props for storage
  savedDesigns: SavedDesign[];
  onSave: (name: string, currentPrompt: string) => void;
  onLoad: (design: SavedDesign) => void;
  onDelete: (id: string) => void;
  currentPrompt: string; // Controlled prompt
  onPromptChange: (val: string) => void;
}

export const RequirementsPanel: React.FC<RequirementsPanelProps> = ({ 
  onFileUpload, 
  onModify, 
  analysisSpec, 
  uploadedFile,
  isAnalyzing,
  isGenerating,
  savedDesigns,
  onSave,
  onLoad,
  onDelete,
  currentPrompt,
  onPromptChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (currentPrompt.trim()) {
      onModify(currentPrompt);
    }
  };

  const handleSaveClick = () => {
    if (!saveName.trim()) return;
    setIsSaving(true);
    // Small delay to show UI feedback
    setTimeout(() => {
        try {
            onSave(saveName, currentPrompt);
            setSaveName('');
        } finally {
            setIsSaving(false);
        }
    }, 200);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-slate-100 bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-800">Design Studio Control</h2>
        <p className="text-xs text-slate-500 mt-1">Upload CAD/PDF and apply modifications</p>
      </div>
      
      <div className="p-5 flex-1 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
        
        {/* 1. Upload Section */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1. Input Source</h3>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              uploadedFile ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,image/*" 
              onChange={handleFileChange}
            />
            {uploadedFile ? (
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                <span className="text-sm font-medium truncate max-w-[200px]">{uploadedFile.name}</span>
              </div>
            ) : (
              <div className="text-slate-500">
                <svg className="mx-auto h-8 w-8 mb-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm">Click to upload PDF or Image</p>
              </div>
            )}
          </div>
        </section>

        {/* 2. Analysis Section */}
        {(isAnalyzing || analysisSpec) && (
          <section className="animate-fade-in">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">2. AI Analysis</h3>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 text-sm">
              {isAnalyzing ? (
                <div className="flex items-center space-x-2 text-indigo-600">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>Analyzing geometry and specs...</span>
                </div>
              ) : (
                <div className="space-y-2">
                   <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{analysisSpec?.rawAnalysis}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 3. Modification Section */}
        <section className="flex flex-col h-full">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">3. Modification Orders</h3>
          <div className="space-y-3 flex-1 flex flex-col">
            <textarea
              value={currentPrompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="E.g., Change the material to aluminum, add wheels to the base, and remove the top handle..."
              className="w-full h-80 p-4 text-base border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y bg-white text-slate-800 placeholder-slate-400 shadow-sm"
            />
            <button
              onClick={handleSubmit}
              disabled={isGenerating || !uploadedFile || !currentPrompt}
              className={`w-full py-3 px-4 rounded-lg text-sm font-medium text-white transition-all shadow-sm flex justify-center items-center
                ${(isGenerating || !uploadedFile || !currentPrompt)
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md active:transform active:scale-95'
                }`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Generating Redesign...
                </>
              ) : (
                'Generate Configuration'
              )}
            </button>
          </div>
        </section>

        {/* 4. Project Library Section */}
        <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">4. Project Library</h3>
            
            {/* Save Current */}
            <div className="flex space-x-2 mb-4">
                <input 
                    type="text" 
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Project Name..." 
                    className="flex-1 text-sm border border-slate-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    disabled={!uploadedFile}
                />
                <button 
                    onClick={handleSaveClick}
                    disabled={!uploadedFile || !saveName.trim() || isSaving}
                    className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
            </div>

            {/* Saved List */}
            {savedDesigns.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {savedDesigns.map((design) => (
                        <div key={design.id} className="group flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-indigo-200 hover:shadow-sm transition-all">
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-slate-800 truncate">{design.name}</h4>
                                <p className="text-[10px] text-slate-400">{formatDate(design.createdAt)}</p>
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => onLoad(design)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded tooltip"
                                    title="Load Project"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                </button>
                                <button 
                                    onClick={() => onDelete(design.id)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                    title="Delete Project"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-400">No saved projects yet</p>
                </div>
            )}
        </section>

      </div>
    </div>
  );
};
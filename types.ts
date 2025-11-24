
export interface DesignSpec {
  title: string;
  extractedDimensions: string[];
  detectedMaterials: string[];
  designFeatures: string[];
  rawAnalysis: string;
}

export interface UploadedFile {
  data: string; // Base64
  mimeType: string;
  name: string;
}

export interface GenerationState {
  isAnalyzing: boolean;
  isGenerating: boolean;
  imageUrl: string | null;
  error: string | null;
}

export interface SavedDesign {
  id: string;
  name: string;
  createdAt: number;
  uploadedFile: UploadedFile;
  analysisSpec: DesignSpec;
  modificationPrompt: string;
  generatedImageUrl: string | null;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
}

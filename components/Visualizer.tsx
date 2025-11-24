
import React, { useState } from 'react';
import { UploadedFile, HistoryItem } from '../types';

interface VisualizerProps {
  isLoading: boolean;
  generatedImageUrl: string | null;
  uploadedFile: UploadedFile | null;
  error: string | null;
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
}

interface ZoomableImageProps {
  src: string;
  alt: string;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({ src, alt }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    // Basic wheel zoom integration
    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.5, scale + delta), 8);
    setScale(newScale);
  };

  const reset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  const zoomIn = () => setScale(s => Math.min(s + 0.5, 8));
  const zoomOut = () => setScale(s => Math.max(s - 0.5, 0.5));

  return (
    <div 
      className="w-full h-full overflow-hidden relative bg-slate-50 flex items-center justify-center cursor-move active:cursor-grabbing group"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      title="Drag to Pan, Scroll to Zoom"
    >
      {/* Pattern background to help see transparency/bounds */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      <div 
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
        className="origin-center"
      >
        <img 
            src={src} 
            alt={alt} 
            className="max-h-[50vh] md:max-h-[60vh] max-w-full object-contain pointer-events-none select-none shadow-sm" 
            draggable={false}
        />
      </div>

      {/* Floating Controls */}
      <div className="absolute bottom-4 right-4 flex space-x-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <button 
            onClick={(e) => { e.stopPropagation(); zoomOut(); }} 
            className="p-2 hover:bg-slate-100 rounded text-slate-700 hover:text-indigo-600 transition-colors"
            title="Zoom Out"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
        </button>
        <button 
            onClick={(e) => { e.stopPropagation(); reset(); }} 
            className="px-2 py-1.5 hover:bg-slate-100 rounded text-xs font-mono font-medium text-slate-700 min-w-[3rem] flex items-center justify-center"
            title="Reset View"
        >
            {Math.round(scale * 100)}%
        </button>
        <button 
            onClick={(e) => { e.stopPropagation(); zoomIn(); }} 
            className="p-2 hover:bg-slate-100 rounded text-slate-700 hover:text-indigo-600 transition-colors"
            title="Zoom In"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>
    </div>
  );
};

export const Visualizer: React.FC<VisualizerProps> = ({ 
  isLoading, 
  generatedImageUrl, 
  uploadedFile, 
  error,
  history,
  onSelectHistory
}) => {
  const isPdf = uploadedFile?.mimeType === 'application/pdf';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
        <h2 className="text-lg font-semibold text-slate-800">Visual Configuration</h2>
        <div className="flex space-x-4">
            <div className="flex items-center text-xs font-medium text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 mr-2"></span> Original Source
            </div>
            <div className="flex items-center text-xs font-medium text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"></span> Generated Model
            </div>
        </div>
      </div>

      <div className="flex-1 bg-slate-100 p-4 overflow-hidden relative">
        {error && (
            <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm z-30 shadow-md">
                <strong className="font-semibold">Error: </strong> {error}
            </div>
        )}
        
        {/* Changed Layout: Flex Row for contrasting sizes with reduced original size (20%) */}
        <div className="flex flex-col md:flex-row gap-4 h-full">
            
            {/* Original View (Smaller ~20%) */}
            <div className="md:w-[20%] h-[20%] md:h-full flex flex-col min-w-[180px]">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-1 flex flex-col relative overflow-hidden h-full">
                    <span className="absolute top-3 left-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider bg-slate-100/90 backdrop-blur px-2 py-1 rounded border border-slate-200 z-20 pointer-events-none">Original</span>
                    <div className="flex-1 w-full h-full relative">
                        {uploadedFile ? (
                            isPdf ? (
                                <div className="flex items-center justify-center h-full text-center text-slate-500 bg-slate-50 rounded-md">
                                    <div className="p-4">
                                        <svg className="mx-auto h-12 w-12 text-red-400 mb-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-xs font-medium block">PDF Document</span>
                                        <p className="text-[10px] mt-1 opacity-75 truncate max-w-full">{uploadedFile.name}</p>
                                    </div>
                                </div>
                            ) : (
                                <ZoomableImage src={uploadedFile.data} alt="Original Design" />
                            )
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-300 text-xs bg-slate-50 rounded-md">
                                No file uploaded
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Generated View (Larger ~80%) */}
            <div className="flex-1 h-[80%] md:h-full flex flex-col min-w-0">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-1 flex flex-col relative overflow-hidden h-full">
                    <span className="absolute top-3 left-3 text-[10px] uppercase font-bold text-indigo-600 tracking-wider bg-indigo-50/90 backdrop-blur px-2 py-1 rounded border border-indigo-100 z-20 pointer-events-none">Generated Redesign</span>
                    
                    {/* Main Image Area */}
                    <div className="flex-1 w-full relative overflow-hidden">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-center bg-slate-50 rounded-md">
                                <div>
                                    <svg className="animate-spin mx-auto h-12 w-12 text-indigo-500 mb-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <p className="text-sm text-indigo-600 font-medium animate-pulse">Rendering 3D Model...</p>
                                    <p className="text-xs text-slate-400 mt-2">Applying modifications</p>
                                </div>
                            </div>
                        ) : generatedImageUrl ? (
                            <ZoomableImage src={generatedImageUrl} alt="Generated Redesign" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-300 text-sm bg-slate-50 rounded-md">
                                Waiting for orders...
                            </div>
                        )}
                    </div>

                    {/* History Strip */}
                    {history.length > 0 && (
                        <div className="h-20 shrink-0 border-t border-slate-100 bg-slate-50 mt-1 p-2 flex space-x-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                             {history.map((item) => (
                                <button 
                                    key={item.id}
                                    onClick={() => onSelectHistory(item)}
                                    className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                                        generatedImageUrl === item.imageUrl 
                                            ? 'border-indigo-500 ring-2 ring-indigo-200' 
                                            : 'border-slate-200 hover:border-indigo-300'
                                    }`}
                                    title={item.prompt}
                                >
                                    <img src={item.imageUrl} alt="History" className="w-full h-full object-cover" />
                                </button>
                             ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

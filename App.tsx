import React, { useState, useEffect } from 'react';
import { Reorder, AnimatePresence } from 'framer-motion';
import { FileDown, Trash2, ArrowDownAZ, ArrowDownZA, RefreshCw, Layers, PenLine } from 'lucide-react';
import { AppFile, PdfQuality } from './types';
import { UploadDropzone } from './components/UploadDropzone';
import { SortableItem } from './components/SortableItem';
import { Button } from './components/Button';
import { generatePdfFromFiles, getPdfSizeEstimate } from './services/pdfService';

const App: React.FC = () => {
  const [files, setFiles] = useState<AppFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  const [quality, setQuality] = useState<PdfQuality>('medium');
  const [outputFilename, setOutputFilename] = useState('Combined');

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      files.forEach(file => URL.revokeObjectURL(file.url));
    };
  }, []);

  // Automatic Filename Detection
  useEffect(() => {
    if (files.length === 0) {
      setOutputFilename('Combined');
      return;
    }

    const names = files.map(f => f.name.replace(/\.(svg|pdf|png|jpg|jpeg)$/i, ''));
    let suggested = names[0];

    // Find common prefix if multiple files exist
    if (names.length > 1) {
       let prefix = names[0];
       for (let i = 1; i < names.length; i++) {
          while (names[i].indexOf(prefix) !== 0) {
             prefix = prefix.substring(0, prefix.length - 1);
             if (prefix === "") break;
          }
       }
       suggested = prefix;
    }
    
    // Clean up trailing numbers/separators
    suggested = suggested.replace(/[-_.\d\s]+$/, '');
    
    // Fallback if common prefix is empty or too short
    if (suggested.length < 2) {
       if (names.length > 1) suggested = "Combined"; 
       else suggested = names[0].replace(/[-_.\d\s]+$/, '');
    }
    
    // Capitalize first letter
    if (suggested.length > 0) {
        suggested = suggested.charAt(0).toUpperCase() + suggested.slice(1);
    } else {
        suggested = "Combined";
    }

    setOutputFilename(suggested);
  }, [files]);

  const handleFilesSelected = (newFiles: File[]) => {
    const newAppFiles: AppFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    }));

    setFiles(prev => [...prev, ...newAppFiles]);
    setSortOrder('none'); // Reset sort order on new files
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleClearAll = () => {
    files.forEach(file => URL.revokeObjectURL(file.url));
    setFiles([]);
    setSortOrder('none');
  };

  const handleSort = () => {
    const nextOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(nextOrder);
    
    const sorted = [...files].sort((a, b) => {
      return nextOrder === 'asc' 
        ? a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        : b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    setFiles(sorted);
  };

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    setProgress(0);
    // Use setTimeout to allow UI to update the modal state before heavy processing
    setTimeout(async () => {
      try {
        await generatePdfFromFiles(
          files, 
          quality, 
          outputFilename, 
          (percent) => setProgress(percent)
        );
      } catch (error) {
        console.error("Failed to generate PDF", error);
        alert("An error occurred while generating the PDF.");
      } finally {
        setIsGenerating(false);
        setProgress(0);
      }
    }, 100);
  };

  const estimatedSize = getPdfSizeEstimate(files.length, quality);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 relative">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md">
              <Layers size={24} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              File to PDF <span className="text-blue-600 font-extrabold">Combiner</span>
            </h1>
          </div>
          <div className="text-sm text-gray-500 hidden sm:block">
            {files.length} {files.length === 1 ? 'file' : 'files'} ready
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Upload Section */}
        <section>
          <UploadDropzone onFilesSelected={handleFilesSelected} />
        </section>

        {files.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Toolbar */}
            <div className="flex flex-col gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                
                {/* Left Side: Sort & Clear */}
                <div className="flex items-center gap-2 w-full xl:w-auto">
                  <Button 
                    variant="secondary" 
                    onClick={handleSort}
                    title="Sort by filename"
                    className="text-sm flex-1 xl:flex-none"
                    icon={sortOrder === 'asc' ? <ArrowDownAZ size={16} /> : <ArrowDownZA size={16} />}
                  >
                    Sort {sortOrder === 'none' ? 'A-Z' : sortOrder === 'asc' ? 'Z-A' : 'A-Z'}
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={handleClearAll}
                    className="text-sm px-3"
                    title="Remove all files"
                    icon={<Trash2 size={16} />}
                  >
                    Clear
                  </Button>
                </div>

                {/* Right Side: Output Settings */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                   
                   {/* Filename Input */}
                   <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1.5 bg-white w-full sm:w-auto focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                      <PenLine size={14} className="text-gray-400" />
                      <input 
                        type="text" 
                        value={outputFilename}
                        onChange={(e) => setOutputFilename(e.target.value)}
                        className="outline-none text-sm text-gray-700 w-full sm:w-32 bg-transparent placeholder-gray-400"
                        placeholder="Filename"
                        aria-label="Output filename"
                      />
                      <span className="text-gray-400 text-sm font-medium">.pdf</span>
                   </div>

                   {/* Quality Selector */}
                   <div className="flex items-center gap-3 w-full sm:w-auto bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                     <div className="flex gap-1 bg-white rounded-md shadow-sm p-0.5 w-full sm:w-auto">
                       {(['low', 'medium', 'high'] as PdfQuality[]).map((q) => (
                         <button
                          key={q}
                          onClick={() => setQuality(q)}
                          className={`
                            px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 capitalize flex-1 sm:flex-none
                            ${quality === q 
                              ? 'bg-blue-600 text-white shadow-sm' 
                              : 'text-gray-600 hover:bg-gray-100'}
                          `}
                         >
                           {q}
                         </button>
                       ))}
                     </div>
                     <div className="text-xs text-gray-500 font-medium px-2 whitespace-nowrap border-l border-gray-200">
                        {estimatedSize}
                     </div>
                  </div>

                  {/* Generate Button */}
                  <Button 
                    onClick={handleGeneratePdf} 
                    isLoading={isGenerating}
                    disabled={isGenerating}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-md whitespace-nowrap"
                    icon={<FileDown size={18} />}
                  >
                    Merge Files
                  </Button>
                </div>
              </div>
            </div>

            {/* List Header */}
            <div className="flex items-center justify-between text-sm font-medium text-gray-500 px-2">
              <span>Order</span>
              <span>Drag to reorder</span>
            </div>

            {/* File List */}
            <Reorder.Group 
              axis="y" 
              values={files} 
              onReorder={setFiles}
              className="space-y-3"
            >
              <AnimatePresence initial={false}>
                {files.map((file, index) => (
                  <SortableItem 
                    key={file.id} 
                    file={file} 
                    index={index} 
                    onRemove={handleRemoveFile} 
                  />
                ))}
              </AnimatePresence>
            </Reorder.Group>
            
          </div>
        )}

        {files.length === 0 && (
            <div className="text-center py-12">
                <div className="inline-flex items-center justify-center p-4 bg-blue-50 text-blue-300 rounded-full mb-4">
                    <RefreshCw size={48} className="opacity-50" />
                </div>
                <h3 className="text-gray-400 font-medium">No files selected yet</h3>
                <p className="text-gray-400 text-sm mt-2">Upload images or PDFs to begin</p>
            </div>
        )}
      </main>

      {/* Progress Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mb-4 relative flex items-center justify-center">
              <svg className="animate-spin w-full h-full text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div className="absolute font-bold text-xs text-blue-600">{progress}%</div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Generating PDF</h3>
            <p className="text-gray-500 mb-6">Processing file {Math.ceil((progress / 100) * files.length) || 1} of {files.length}...</p>
            
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <p className="text-xs text-gray-400 mt-4">Merging files and optimizing images...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
import React, { useCallback, useState } from 'react';
import { Upload, FilePlus } from 'lucide-react';

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onFilesSelected }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file: File) => file.type === 'image/svg+xml' || file.name.endsWith('.svg')
    );
    
    if (droppedFiles.length > 0) {
      onFilesSelected(droppedFiles);
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(
        (file: File) => file.type === 'image/svg+xml' || file.name.endsWith('.svg')
      );
      if (selectedFiles.length > 0) {
        onFilesSelected(selectedFiles);
      }
    }
    // Reset input value to allow selecting same files again if needed
    e.target.value = '';
  }, [onFilesSelected]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer border-2 border-dashed rounded-xl p-10
        flex flex-col items-center justify-center text-center transition-all duration-300
        ${isDragOver 
          ? 'border-blue-500 bg-blue-50 scale-[1.01]' 
          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 bg-white'}
      `}
    >
      <input
        type="file"
        multiple
        accept=".svg,image/svg+xml"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label="Upload SVG files"
      />
      
      <div className={`
        p-4 rounded-full mb-4 transition-colors duration-300
        ${isDragOver ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:text-blue-500 group-hover:bg-blue-50'}
      `}>
        {isDragOver ? <FilePlus size={32} /> : <Upload size={32} />}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {isDragOver ? 'Drop files to add' : 'Click or drag SVGs here'}
      </h3>
      <p className="text-sm text-gray-500 max-w-xs">
        Select multiple .svg files to combine them into a single PDF document.
      </p>
    </div>
  );
};
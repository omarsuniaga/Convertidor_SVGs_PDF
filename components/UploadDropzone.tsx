import React, { useCallback, useState } from 'react';
import { Upload, FilePlus, FileType } from 'lucide-react';

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/svg+xml': ['.svg']
};

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

  const filterFiles = (files: File[]): File[] => {
    return files.filter(file => {
      const type = file.type;
      const name = file.name.toLowerCase();
      return (
        type === 'application/pdf' ||
        type === 'image/jpeg' ||
        type === 'image/png' ||
        type === 'image/svg+xml' ||
        name.endsWith('.pdf') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.png') ||
        name.endsWith('.svg')
      );
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files) as File[];
    const validFiles = filterFiles(droppedFiles);
    
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files) as File[];
      const validFiles = filterFiles(selectedFiles);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
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
        accept=".pdf,.jpg,.jpeg,.png,.svg,application/pdf,image/jpeg,image/png,image/svg+xml"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label="Upload files"
      />
      
      <div className={`
        p-4 rounded-full mb-4 transition-colors duration-300
        ${isDragOver ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:text-blue-500 group-hover:bg-blue-50'}
      `}>
        {isDragOver ? <FilePlus size={32} /> : <Upload size={32} />}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {isDragOver ? 'Drop files to add' : 'Click or drag files here'}
      </h3>
      <p className="text-sm text-gray-500 max-w-sm">
        Merge PDF, JPG, PNG, or SVG files into a single document.
      </p>
      <div className="flex gap-2 mt-4 text-xs text-gray-400 font-medium">
        <span className="px-2 py-1 bg-gray-100 rounded">PDF</span>
        <span className="px-2 py-1 bg-gray-100 rounded">JPG</span>
        <span className="px-2 py-1 bg-gray-100 rounded">PNG</span>
        <span className="px-2 py-1 bg-gray-100 rounded">SVG</span>
      </div>
    </div>
  );
};
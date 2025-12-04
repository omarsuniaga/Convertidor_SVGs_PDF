import React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, X, FileImage } from 'lucide-react';
import { SvgFile } from '../types';

interface SortableItemProps {
  file: SvgFile;
  index: number;
  onRemove: (id: string) => void;
}

export const SortableItem: React.FC<SortableItemProps> = ({ file, index, onRemove }) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={file}
      id={file.id}
      dragListener={false}
      dragControls={dragControls}
      className="relative mb-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileDrag={{ scale: 1.02, zIndex: 10, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
    >
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center shadow-sm select-none group hover:border-blue-300 transition-colors">
        {/* Drag Handle */}
        <div 
          className="cursor-grab active:cursor-grabbing p-2 mr-2 text-gray-400 hover:text-gray-600 touch-none"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical size={20} />
        </div>

        {/* Index Indicator */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-semibold mr-4">
          {index + 1}
        </div>

        {/* Preview Thumbnail */}
        <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-md overflow-hidden flex items-center justify-center mr-4 p-1">
          <img 
            src={file.url} 
            alt={file.name} 
            className="w-full h-full object-contain pointer-events-none" 
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <FileImage 
            size={20} 
            className="text-gray-300 absolute" 
            style={{ display: 'none' }} // Only show if img fails, simplified here by always trying img first
          /> 
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0 mr-4">
          <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-gray-500">
            {(file.file.size / 1024).toFixed(1)} KB
          </p>
        </div>

        {/* Actions */}
        <button
          onClick={() => onRemove(file.id)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          aria-label="Remove file"
        >
          <X size={20} />
        </button>
      </div>
    </Reorder.Item>
  );
};

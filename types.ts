export interface SvgFile {
  id: string;
  file: File;
  name: string;
  url: string; // Object URL for preview and processing
  width?: number;
  height?: number;
}

export type SortOrder = 'asc' | 'desc' | 'none';

export type PdfQuality = 'low' | 'medium' | 'high';

export interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
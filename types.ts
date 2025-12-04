export interface AppFile {
  id: string;
  file: File;
  name: string;
  type: string; // MIME type
  url: string; // Object URL
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
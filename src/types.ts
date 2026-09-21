export interface UploadedImage {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
}

export type PageSize = 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5' | 'Tabloid' | 'Fit';
export type PageOrientation = 'auto' | 'portrait' | 'landscape';
export type ImageFitMode = 'contain' | 'fill' | 'stretch';
export type MarginOption = 'none' | 'narrow' | 'normal' | 'wide' | 'custom';

export interface ConversionOptions {
  pageSize: PageSize;
  orientation: PageOrientation;
  margin: number; // in points (0, 18, 36, 54)
  marginPreset: MarginOption;
  fit: ImageFitMode;
  pageNumbers: boolean;
  title: string;
  author: string;
  filename: string;
}

export interface ConversionStats {
  success?: boolean;
  output?: string;
  sizeBytes?: number;
  pageCount?: number;
  durationMs?: number;
  engine?: string;
  pageSize?: string;
  orientation?: string;
}

export interface ConversionResult {
  pdfBase64: string;
  fileName: string;
  sizeBytes: number;
  pageCount: number;
  durationMs: number;
  stats?: ConversionStats;
  pythonOutput?: string;
}

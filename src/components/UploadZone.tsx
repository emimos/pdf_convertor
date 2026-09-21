import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Plus } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  onLoadSamples: () => void;
  compact?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelected,
  onLoadSamples,
  compact = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      // Reset input value so re-selecting same files triggers change
      e.target.value = '';
    }
  };

  if (compact) {
    return (
      <div
        id="compact-upload-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/60'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-100/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />
        <Plus className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-slate-700">Add More Images</span>
        <span className="text-xs text-slate-400 font-normal">or drop files here</span>
      </div>
    );
  }

  return (
    <div
      id="main-upload-zone"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
        isDragOver
          ? 'border-blue-500 bg-blue-50/70 scale-[1.005]'
          : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/50 shadow-xs'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className="flex flex-col items-center max-w-md mx-auto">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-16 h-16 mb-4 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs cursor-pointer hover:bg-blue-100 hover:scale-105 transition-all"
        >
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Drop your images here, or{' '}
          <button
            id="browse-files-inline-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700 underline font-semibold cursor-pointer"
          >
            browse
          </button>
        </h3>
        <p className="text-sm text-slate-500 mb-5">
          Supports PNG, JPG, JPEG, WebP, GIF, BMP, and SVG. Reorder pages and adjust layout before converting.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            id="browse-files-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            Select Images from Device
          </button>

          <button
            id="try-sample-images-btn"
            type="button"
            onClick={onLoadSamples}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            Try Sample Images
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-4 text-xs text-slate-400">
          <span>Lossless processing</span>
          <span>•</span>
          <span>Multi-page merge</span>
          <span>•</span>
          <span>Zero watermarks</span>
        </div>
      </div>
    </div>
  );
};

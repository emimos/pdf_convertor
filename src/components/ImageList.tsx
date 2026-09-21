import React from 'react';
import { UploadedImage } from '../types';
import { formatBytes } from '../utils/imageUtils';
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Maximize2,
  FileImage,
  ArrowUpDown,
} from 'lucide-react';

interface ImageListProps {
  images: UploadedImage[];
  onRotate: (id: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: (id: string) => void;
  onPreview: (image: UploadedImage) => void;
}

export const ImageList: React.FC<ImageListProps> = ({
  images,
  onRotate,
  onMove,
  onRemove,
  onPreview,
}) => {
  const totalSize = images.reduce((acc, curr) => acc + curr.size, 0);

  return (
    <div id="image-list-container" className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">
            PDF Pages ({images.length})
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Total {formatBytes(totalSize)}
          </span>
        </div>
        <p className="text-xs text-slate-400 hidden sm:block">
          Use arrows to reorder pages • Click thumbnail to inspect
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {images.map((img, index) => {
          return (
            <div
              key={img.id}
              id={`image-card-${index}`}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between group"
            >
              {/* Header: Page Badge & Move controls */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                    {index + 1}
                  </span>
                  <span className="text-xs font-medium text-slate-600 truncate max-w-[120px]" title={img.name}>
                    {img.name}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onMove(index, index - 1)}
                    disabled={index === 0}
                    title="Move earlier (Page Up)"
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(index, index + 1)}
                    disabled={index === images.length - 1}
                    title="Move later (Page Down)"
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Thumbnail Container */}
              <div
                className="relative w-full h-36 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer border border-slate-100 group/thumb"
                onClick={() => onPreview(img)}
                title="Click to view full image"
              >
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  style={{
                    transform: `rotate(${img.rotation}deg)`,
                    transition: 'transform 0.2s ease',
                  }}
                  className="max-h-full max-w-full object-contain pointer-events-none"
                />

                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5">
                  <Maximize2 className="w-5 h-5 drop-shadow" />
                  <span className="text-xs font-medium drop-shadow">Inspect</span>
                </div>

                {img.rotation !== 0 && (
                  <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono">
                    {img.rotation}°
                  </span>
                )}
              </div>

              {/* Footer: Metadata & Actions */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  <span>{img.width}×{img.height}</span>
                  <span className="mx-1">•</span>
                  <span>{formatBytes(img.size)}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onRotate(img.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    title="Rotate 90° clockwise"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(img.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

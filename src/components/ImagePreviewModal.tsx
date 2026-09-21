import React from 'react';
import { UploadedImage } from '../types';
import { formatBytes } from '../utils/imageUtils';
import { X, RotateCw, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';

interface ImagePreviewModalProps {
  image: UploadedImage | null;
  onClose: () => void;
  onRotate: (id: string) => void;
  onRemove: (id: string) => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  image,
  onClose,
  onRotate,
  onRemove,
}) => {
  if (!image) return null;

  return (
    <div
      id="image-preview-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-900 rounded-2xl max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="truncate mr-4">
            <h4 className="text-sm font-semibold truncate">{image.name}</h4>
            <p className="text-xs text-slate-400">
              {image.width} × {image.height} px • {formatBytes(image.size)} • Rotation: {image.rotation}°
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onRotate(image.id)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Rotate 90° clockwise"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                onRemove(image.id);
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Delete image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="flex-1 bg-black flex items-center justify-center p-4 overflow-hidden min-h-[360px] max-h-[70vh]">
          <img
            src={image.dataUrl}
            alt={image.name}
            style={{
              transform: `rotate(${image.rotation}deg)`,
              transition: 'transform 0.25s ease',
            }}
            className="max-h-full max-w-full object-contain select-none"
          />
        </div>
      </div>
    </div>
  );
};

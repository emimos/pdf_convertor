import React, { useState } from 'react';
import { ConversionOptions, PageSize, PageOrientation, ImageFitMode, MarginOption } from '../types';
import {
  FileText,
  Sliders,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  Loader2,
  Settings2,
  FileCheck,
} from 'lucide-react';

interface ConversionSettingsProps {
  options: ConversionOptions;
  onChange: (options: ConversionOptions) => void;
  onConvert: () => void;
  imageCount: number;
  isConverting: boolean;
}

export const ConversionSettings: React.FC<ConversionSettingsProps> = ({
  options,
  onChange,
  onConvert,
  imageCount,
  isConverting,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handlePageSizeChange = (pageSize: PageSize) => {
    onChange({ ...options, pageSize });
  };

  const handleOrientationChange = (orientation: PageOrientation) => {
    onChange({ ...options, orientation });
  };

  const handleMarginChange = (marginPreset: MarginOption) => {
    let margin = 36;
    if (marginPreset === 'none') margin = 0;
    if (marginPreset === 'narrow') margin = 18;
    if (marginPreset === 'normal') margin = 36;
    if (marginPreset === 'wide') margin = 54;

    onChange({ ...options, marginPreset, margin });
  };

  const handleFitChange = (fit: ImageFitMode) => {
    onChange({ ...options, fit });
  };

  return (
    <div id="conversion-settings-card" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">PDF Layout & Settings</h3>
            <p className="text-xs text-slate-500">Configure page geometry and metadata</p>
          </div>
        </div>
      </div>

      {/* Page Size Selection */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Page Format
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              { id: 'A4', label: 'A4', desc: '210 × 297 mm' },
              { id: 'Letter', label: 'US Letter', desc: '8.5 × 11 in' },
              { id: 'Fit', label: 'Fit to Image', desc: 'Match image size' },
              { id: 'Legal', label: 'Legal', desc: '8.5 × 14 in' },
              { id: 'A3', label: 'A3', desc: '297 × 420 mm' },
              { id: 'Tabloid', label: 'Tabloid', desc: '11 × 17 in' },
            ] as const
          ).map((item) => {
            const isSelected = options.pageSize === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handlePageSizeChange(item.id as PageSize)}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900 shadow-2xs ring-1 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold leading-none mb-1">{item.label}</div>
                <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orientation (only if not 'Fit') */}
      {options.pageSize !== 'Fit' && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Page Orientation
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'auto', label: 'Auto Detect', desc: 'Match image aspect' },
              { id: 'portrait', label: 'Portrait', desc: 'Vertical' },
              { id: 'landscape', label: 'Landscape', desc: 'Horizontal' },
            ].map((item) => {
              const isSelected = options.orientation === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleOrientationChange(item.id as PageOrientation)}
                  className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 text-blue-900 shadow-2xs ring-1 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-semibold leading-none mb-0.5">{item.label}</div>
                  <div className="text-[10px] text-slate-400">{item.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Margins */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Page Margin
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'none', label: 'None', desc: '0 pt' },
            { id: 'narrow', label: 'Narrow', desc: '18 pt' },
            { id: 'normal', label: 'Normal', desc: '36 pt' },
            { id: 'wide', label: 'Wide', desc: '54 pt' },
          ].map((item) => {
            const isSelected = options.marginPreset === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleMarginChange(item.id as MarginOption)}
                className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold leading-none">{item.label}</div>
                <div className="text-[10px] text-slate-400 mt-1">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Image Fitting Mode */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Image Sizing & Fit
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'contain', label: 'Contain (Fit)', desc: 'Keep aspect ratio' },
            { id: 'fill', label: 'Fill Page', desc: 'Crop overflow' },
            { id: 'stretch', label: 'Stretch', desc: 'Fit exactly to margin' },
          ].map((item) => {
            const isSelected = options.fit === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleFitChange(item.id as ImageFitMode)}
                className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold leading-none">{item.label}</div>
                <div className="text-[10px] text-slate-400 mt-1">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Page Numbers Toggle */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <div>
          <label htmlFor="page-numbers-checkbox" className="text-xs font-semibold text-slate-800 cursor-pointer">
            Add Page Numbers
          </label>
          <p className="text-[11px] text-slate-400">Prints 'Page X of Y' in footer</p>
        </div>
        <input
          id="page-numbers-checkbox"
          type="checkbox"
          checked={options.pageNumbers}
          onChange={(e) => onChange({ ...options, pageNumbers: e.target.checked })}
          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
        />
      </div>

      {/* Advanced Options Accordion */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-xs font-medium text-slate-600 hover:text-slate-900 py-1 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5 text-slate-400" />
            PDF Metadata & File Name
          </span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-2.5 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={options.title}
                onChange={(e) => onChange({ ...options, title: e.target.value })}
                placeholder="e.g. Scanned Invoice Bundle"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Author / Organization
              </label>
              <input
                type="text"
                value={options.author}
                onChange={(e) => onChange({ ...options, author: e.target.value })}
                placeholder="e.g. Finance Dept"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Output Filename (.pdf)
              </label>
              <input
                type="text"
                value={options.filename}
                onChange={(e) => onChange({ ...options, filename: e.target.value })}
                placeholder="document"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Convert CTA Button */}
      <div className="pt-2">
        <button
          id="convert-to-pdf-btn"
          type="button"
          disabled={imageCount === 0 || isConverting}
          onClick={onConvert}
          className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isConverting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Compiling with Python 3.10...</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 text-blue-100" />
              <span>
                Convert {imageCount} {imageCount === 1 ? 'Image' : 'Images'} to PDF
              </span>
              <ArrowRight className="w-4 h-4 text-blue-200 ml-1" />
            </>
          )}
        </button>

        {imageCount > 0 && (
          <p className="text-[11px] text-center text-slate-400 mt-2">
            Server-authoritative Python conversion • Standard PDF/1.4 compliant
          </p>
        )}
      </div>
    </div>
  );
};

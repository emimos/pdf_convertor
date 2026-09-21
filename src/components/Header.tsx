import React from 'react';
import { Terminal, RefreshCw, Trash2, Sparkles, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  imageCount: number;
  pythonVersion: string | null;
  onOpenPythonHub: () => void;
  onLoadSamples: () => void;
  onClearAll: () => void;
  isConverting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  imageCount,
  pythonVersion,
  onOpenPythonHub,
  onLoadSamples,
  onClearAll,
  isConverting,
}) => {
  return (
    <header id="app-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Brand & Engine status */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-sm ring-1 ring-blue-500/20">
              {/* Python inspired minimal icon badge */}
              <span className="font-mono font-bold text-sm tracking-tighter">Py</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                  Image to PDF Converter
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Python Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {pythonVersion ? `${pythonVersion} Runtime Ready` : 'High-Performance Python PDF Builder'}
              </p>
            </div>
          </div>

          {/* Mobile view quick button */}
          <button
            id="mobile-python-hub-btn"
            type="button"
            onClick={onOpenPythonHub}
            className="sm:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-600" />
            Code
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            id="header-load-samples-btn"
            type="button"
            onClick={onLoadSamples}
            disabled={isConverting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Load ready-made demo documents"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Load Samples
          </button>

          <button
            id="header-python-code-btn"
            type="button"
            onClick={onOpenPythonHub}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-colors cursor-pointer"
            title="View Python scripts, Pillow/img2pdf code, and CLI terminal"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-600" />
            Python Code & CLI
          </button>

          {imageCount > 0 && (
            <button
              id="header-clear-all-btn"
              type="button"
              onClick={onClearAll}
              disabled={isConverting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Clear all images"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              Clear
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

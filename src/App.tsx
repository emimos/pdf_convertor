/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UploadedImage, ConversionOptions, ConversionResult } from './types';
import { fileToUploadedImage, generateSampleImages, bakeRotationToDataUrl } from './utils/imageUtils';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { ImageList } from './components/ImageList';
import { ConversionSettings } from './components/ConversionSettings';
import { PdfPreview } from './components/PdfPreview';
import { PythonCodeModal } from './components/PythonCodeModal';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import {
  FileText,
  Sparkles,
  Terminal,
  Layers,
  CheckCircle2,
  AlertCircle,
  Code2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function App() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [pythonVersion, setPythonVersion] = useState<string | null>('Python 3.10');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [options, setOptions] = useState<ConversionOptions>({
    pageSize: 'A4',
    orientation: 'auto',
    margin: 36,
    marginPreset: 'normal',
    fit: 'contain',
    pageNumbers: true,
    title: 'Image to PDF Document',
    author: 'Python Image Converter',
    filename: 'converted_document',
  });

  // Fetch Python environment status on startup
  useEffect(() => {
    fetch('/api/python-info')
      .then((res) => res.json())
      .then((data) => {
        if (data.pythonVersion) {
          setPythonVersion(data.pythonVersion);
        }
      })
      .catch((err) => console.log('Python info check:', err));
  }, []);

  const handleFilesSelected = async (files: FileList | File[]) => {
    setErrorMessage(null);
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(f.name)) {
        validFiles.push(f);
      }
    }

    if (validFiles.length === 0) {
      setErrorMessage('Please choose valid image files (JPG, PNG, WebP, GIF, BMP, SVG).');
      return;
    }

    try {
      const newImages = await Promise.all(validFiles.map((file) => fileToUploadedImage(file)));
      setImages((prev) => [...prev, ...newImages]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process selected images.');
    }
  };

  const handleLoadSamples = async () => {
    setErrorMessage(null);
    try {
      const samples = await generateSampleImages();
      setImages((prev) => [...prev, ...samples]);
    } catch (err: any) {
      setErrorMessage('Failed to generate demo sample images.');
    }
  };

  const handleRotate = (id: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img))
    );
    if (previewImage && previewImage.id === id) {
      setPreviewImage((prev) => (prev ? { ...prev, rotation: (prev.rotation + 90) % 360 } : null));
    }
  };

  const handleMove = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  };

  const handleRemove = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (previewImage?.id === id) {
      setPreviewImage(null);
    }
  };

  const handleClearAll = () => {
    setImages([]);
    setConversionResult(null);
    setErrorMessage(null);
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setIsConverting(true);
    setErrorMessage(null);

    try {
      // Bake rotations into data URLs so the backend receives properly rotated images
      const preparedImages = await Promise.all(
        images.map(async (img) => {
          const orientedDataUrl = await bakeRotationToDataUrl(img);
          return {
            id: img.id,
            name: img.name,
            dataUrl: orientedDataUrl,
            rotation: 0, // already baked into pixels
          };
        })
      );

      const payload = {
        images: preparedImages,
        pageSize: options.pageSize,
        orientation: options.orientation,
        margin: options.margin,
        fit: options.fit,
        title: options.title || 'Image to PDF Document',
        author: options.author || 'Python PDF Converter',
        pageNumbers: options.pageNumbers,
      };

      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Conversion failed');
      }

      setConversionResult(data);
    } catch (err: any) {
      console.error('Conversion failed:', err);
      setErrorMessage(err.message || 'Failed to convert images with Python script.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Navigation */}
      <Header
        imageCount={images.length}
        pythonVersion={pythonVersion}
        onOpenPythonHub={() => setIsPythonModalOpen(true)}
        onLoadSamples={handleLoadSamples}
        onClearAll={handleClearAll}
        isConverting={isConverting}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Conversion Error</p>
                <p className="text-xs text-rose-600 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {images.length === 0 ? (
          /* Empty State / Welcome Dropzone */
          <div className="max-w-3xl mx-auto space-y-8 py-4">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 mb-1">
                <Terminal className="w-3.5 h-3.5 text-blue-600" />
                <span>Standard Library Python 3.10 Engine</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                Convert Images to Clean PDF Documents
              </h2>
              <p className="text-base text-slate-500 max-w-xl mx-auto">
                Upload photos, scans, charts, or documents. Reorder pages, select custom page layouts, and compile into standardized PDF files using Python.
              </p>
            </div>

            <UploadZone
              onFilesSelected={handleFilesSelected}
              onLoadSamples={handleLoadSamples}
            />

            {/* Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Multi-Page Merging</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Combine multiple JPG, PNG, and WebP images into a single multi-page PDF document.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Pure Python Powered</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Subprocess execution in Python 3.10 with zero watermarks and lossless binary embedding.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Downloadable Code</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Inspect and copy Pillow, img2pdf, and pure standard library Python scripts for local CLI usage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Active Conversion Workspace (2-Column Grid) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Image Cards & Dropzone (8 cols on lg) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              <UploadZone
                compact
                onFilesSelected={handleFilesSelected}
                onLoadSamples={handleLoadSamples}
              />

              <ImageList
                images={images}
                onRotate={handleRotate}
                onMove={handleMove}
                onRemove={handleRemove}
                onPreview={(img) => setPreviewImage(img)}
              />
            </div>

            {/* Right: PDF Layout & Settings Sidebar (4 cols on lg) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4 sticky top-20">
              <ConversionSettings
                options={options}
                onChange={setOptions}
                onConvert={handleConvert}
                imageCount={images.length}
                isConverting={isConverting}
              />

              {/* Quick Python script preview teaser card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                    Python Converter Architecture
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPythonModalOpen(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    View Code & REPL
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  Powered by Python 3.10 standard library script <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded text-[11px]">converter.py</code>.
                </p>
                <div className="bg-slate-900 rounded-lg p-2.5 font-mono text-[11px] text-emerald-400">
                  $ python3 converter.py --config config.json
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* PDF Result Preview Modal */}
      {conversionResult && (
        <PdfPreview
          result={conversionResult}
          onClose={() => setConversionResult(null)}
        />
      )}

      {/* Python Code Hub & Terminal Modal */}
      {isPythonModalOpen && (
        <PythonCodeModal onClose={() => setIsPythonModalOpen(false)} />
      )}

      {/* Image Inspection Zoom Modal */}
      {previewImage && (
        <ImagePreviewModal
          image={previewImage}
          onClose={() => setPreviewImage(null)}
          onRotate={handleRotate}
          onRemove={handleRemove}
        />
      )}
    </div>
  );
}

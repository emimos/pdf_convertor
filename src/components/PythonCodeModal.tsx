import React, { useState } from 'react';
import { PYTHON_SNIPPETS } from '../utils/pythonSnippets';
import {
  Terminal,
  Copy,
  Check,
  Download,
  X,
  Play,
  Loader2,
  Code2,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface PythonCodeModalProps {
  onClose: () => void;
}

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({ onClose }) => {
  const [selectedTab, setSelectedTab] = useState<string>('pillow');
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'snippets' | 'runner'>('snippets');

  // Interactive runner state
  const [customCode, setCustomCode] = useState<string>(
`# Test Python 3 on this server
import sys
import zlib
import struct

print(f"Python Runtime: {sys.version}")
print(f"Standard Library zlib is available: {zlib.__name__}")

# Check test bytes
test_data = b"Hello from Python Image-to-PDF Engine!"
compressed = zlib.compress(test_data)
print(f"Compressed {len(test_data)} bytes to {len(compressed)} bytes.")
`
  );
  const [runnerOutput, setRunnerOutput] = useState<string | null>(null);
  const [runnerError, setRunnerError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const currentSnippet = PYTHON_SNIPPETS.find((s) => s.id === selectedTab) || PYTHON_SNIPPETS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadStandaloneScript = () => {
    window.location.href = '/api/download-python-script';
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setRunnerOutput(null);
    setRunnerError(null);

    try {
      const res = await fetch('/api/run-python', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: customCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRunnerError(data.error || 'Execution failed');
      } else {
        setRunnerOutput(data.stdout || '(Script executed cleanly with no stdout output)');
        if (data.stderr) {
          setRunnerError(data.stderr);
        }
      }
    } catch (err: any) {
      setRunnerError(err.message || 'Network error running Python code');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div
      id="python-code-modal"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Python Image to PDF Architecture
              </h3>
              <p className="text-xs text-slate-500">
                Ready-to-use Python scripts, standalone CLI, and library recipes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadStandaloneScript}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              title="Download standalone converter.py"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              Download .py Script
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-tab selection (Recipes vs Live Runner) */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveSubTab('snippets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'snippets'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                Python Recipes & Libraries
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('runner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'runner'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5" />
                Live Python Runner / REPL
              </span>
            </button>
          </div>

          {activeSubTab === 'snippets' && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          )}
        </div>

        {activeSubTab === 'snippets' ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Library Selector Tabs */}
            <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-50/70 border-b border-slate-200 overflow-x-auto">
              {PYTHON_SNIPPETS.map((snippet) => {
                const isSelected = snippet.id === selectedTab;
                return (
                  <button
                    key={snippet.id}
                    type="button"
                    onClick={() => setSelectedTab(snippet.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold border border-slate-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>{snippet.name}</span>
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500 font-normal">
                      {snippet.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Description & Install Command */}
            <div className="px-5 py-2.5 bg-slate-50/40 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <p className="text-slate-600 font-medium">{currentSnippet.description}</p>
              <div className="bg-slate-800 text-emerald-400 font-mono px-2.5 py-1 rounded text-[11px] self-start sm:self-auto shrink-0">
                {currentSnippet.installCmd}
              </div>
            </div>

            {/* Code Body */}
            <div className="flex-1 bg-slate-950 p-4 overflow-auto max-h-[55vh]">
              <pre className="font-mono text-xs text-slate-200 leading-relaxed">
                <code>{currentSnippet.code}</code>
              </pre>
            </div>
          </div>
        ) : (
          /* Interactive Live Python Runner */
          <div className="flex-1 p-5 space-y-4 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  Python Code (Runs directly in server container)
                </label>
                <span className="text-[11px] text-slate-400 font-mono">Python 3.10.12</span>
              </div>
              <textarea
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                rows={8}
                className="w-full font-mono text-xs p-3 rounded-xl bg-slate-900 text-emerald-300 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                spellCheck={false}
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleRunCode}
                disabled={isRunning}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Running Python...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Execute Python Script
                  </>
                )}
              </button>
              <span className="text-[11px] text-slate-400">
                Standard library modules (os, sys, struct, zlib, math, time)
              </span>
            </div>

            {/* Terminal Output */}
            {(runnerOutput || runnerError) && (
              <div className="mt-3">
                <div className="text-xs font-semibold text-slate-700 mb-1.5">Output Console</div>
                <div className="bg-slate-950 rounded-xl p-3 font-mono text-xs border border-slate-800 max-h-48 overflow-auto">
                  {runnerOutput && (
                    <div className="text-emerald-400 whitespace-pre-wrap">{runnerOutput}</div>
                  )}
                  {runnerError && (
                    <div className="text-rose-400 whitespace-pre-wrap mt-1">{runnerError}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

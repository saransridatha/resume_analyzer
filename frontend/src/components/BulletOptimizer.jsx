import React, { useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';

export default function BulletOptimizer({ optimizations = [] }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  if (optimizations.length === 0) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center w-full">
        <p className="text-slate-400 dark:text-slate-500">No bullet point optimizations available. Make sure to upload a resume with work history bullet points.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden w-full">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-blue-500" />
        <h3 className="font-bold text-slate-800 dark:text-slate-200">AI Bullet Point Optimizer</h3>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {optimizations.map((item, idx) => (
          <div key={idx} className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
            {/* Original Bullet */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Original Draft</span>
              <p className="text-sm text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-900">
                "{item.original}"
              </p>
            </div>
            
            {/* Optimized Bullet */}
            <div className="space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider text-emerald-500 dark:text-emerald-400 uppercase">Gemini Optimized (XYZ Formula)</span>
                  <button
                    onClick={() => handleCopy(item.optimized, idx)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 font-medium bg-emerald-50/20 dark:bg-emerald-950/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50 mt-2">
                  "{item.optimized}"
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

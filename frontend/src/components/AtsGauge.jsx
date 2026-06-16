import React from 'react';
import { motion } from 'framer-motion';

export default function AtsGauge({ score = 0 }) {
  // Ensure the score is in the [0, 100] range
  const clampedScore = Math.max(0, Math.min(100, score));
  
  // Circumference of radius 50 circle = 2 * PI * r = 314.16
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const getColor = (s) => {
    if (s < 50) return { stroke: '#ef4444', text: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/20' };
    if (s < 80) return { stroke: '#f59e0b', text: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' };
    return { stroke: '#10b981', text: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' };
  };

  const currentTheme = getColor(clampedScore);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">Overall Match Score</h3>
      <div className="relative h-44 w-44">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth={strokeWidth}
          />
          {/* Animated score circle */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke={currentTheme.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-4xl font-extrabold tracking-tight ${currentTheme.text}`}>
            {clampedScore}
          </span>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mt-0.5">
            ATS Score
          </span>
        </div>
      </div>
      <div className={`mt-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${currentTheme.text} ${currentTheme.bg}`}>
        {clampedScore < 50 ? 'Needs Improvement' : clampedScore < 80 ? 'Competitive' : 'Excellent Fit'}
      </div>
    </div>
  );
}

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function BreakdownChart({ breakdown = {} }) {
  const { keywords = 0, skills = 0, experience = 0, formatting = 0 } = breakdown;

  // Max points: keywords (30), skills (30), experience (25), formatting (15)
  const chartData = [
    { name: 'Keywords', score: keywords, max: 30, pct: Math.round((keywords / (30 || 1)) * 100), color: '#3b82f6' },
    { name: 'Skills Match', score: skills, max: 30, pct: Math.round((skills / (30 || 1)) * 100), color: '#10b981' },
    { name: 'Experience', score: experience, max: 25, pct: Math.round((experience / (25 || 1)) * 100), color: '#f59e0b' },
    { name: 'Formatting', score: formatting, max: 15, pct: Math.round((formatting / (15 || 1)) * 100), color: '#8b5cf6' },
  ];

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between w-full">
      <div>
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-6">Evaluation Category Breakdown</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              layout="vertical"
              margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis 
                type="number" 
                domain={[0, 100]}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(val) => `${val}%`}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-md border border-slate-800 text-xs">
                        <p className="font-semibold">{data.name}</p>
                        <p className="mt-1 font-bold text-blue-400">Match Percentage: {data.pct}%</p>
                        <p className="text-slate-400">Points Received: {data.score} / {data.max}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={16}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        {chartData.map((item) => (
          <div key={item.name} className="text-center md:text-left">
            <span className="text-xs text-slate-400 block">{item.name}</span>
            <span className="text-sm font-bold mt-0.5 inline-block" style={{ color: item.color }}>
              {item.score} / {item.max}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

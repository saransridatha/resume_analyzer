import React from 'react';
import { 
 LineChart, 
 Line, 
 XAxis, 
 YAxis, 
 CartesianGrid, 
 Tooltip, 
 ResponsiveContainer 
} from 'recharts';

export default function HistoryChart({ history = [] }) {
 // Process and sort history chronologically (ascending) for rendering
 const chartData = [...history]
 .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
 .map(item => ({
 date: new Date(item.timestamp).toLocaleDateString(undefined, { 
 month: 'short', 
 day: 'numeric' 
 }),
 score: item.atsScore,
 filename: item.filename
 }));

 if (chartData.length === 0) {
 return (
 <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-slate-200 ">
 <p className="text-slate-400">No score history available.</p>
 </div>
 );
 }

 return (
 <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm w-full">
 <h3 className="text-sm font-semibold text-slate-500 mb-6">Score History Trend</h3>
 <div className="h-72 w-full">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 " />
 <XAxis 
 dataKey="date" 
 tick={{ fill: '#94a3b8', fontSize: 11 }}
 tickLine={false}
 axisLine={false}
 />
 <YAxis 
 domain={[0, 100]} 
 tick={{ fill: '#94a3b8', fontSize: 11 }}
 tickLine={false}
 axisLine={false}
 />
 <Tooltip
 content={({ active, payload }) => {
 if (active && payload && payload.length) {
 const data = payload[0].payload;
 return (
 <div className="bg-slate-900 text-white p-3 rounded-lg shadow-md border border-slate-800 text-xs">
 <p className="font-semibold text-slate-300">{data.date}</p>
 <p className="mt-1 font-bold text-blue-400">Score: {data.score}</p>
 <p className="text-slate-400 truncate max-w-[150px]">{data.filename}</p>
 </div>
 );
 }
 return null;
 }}
 />
 <Line 
 type="monotone" 
 dataKey="score" 
 stroke="#3b82f6" 
 strokeWidth={3} 
 activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }}
 dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
 />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>
 );
}

import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function UploadForm({ onAnalyze, loading, error }) {
 const [file, setFile] = useState(null);
 const [jd, setJd] = useState('');
 const [dragActive, setDragActive] = useState(false);
 const fileInputRef = useRef(null);

 const handleDrag = (e) => {
 e.preventDefault();
 e.stopPropagation();
 if (e.type === "dragenter" || e.type === "dragover") {
 setDragActive(true);
 } else if (e.type === "dragleave") {
 setDragActive(false);
 }
 };

 const handleDrop = (e) => {
 e.preventDefault();
 e.stopPropagation();
 setDragActive(false);
 
 if (e.dataTransfer.files && e.dataTransfer.files[0]) {
 const droppedFile = e.dataTransfer.files[0];
 validateAndSetFile(droppedFile);
 }
 };

 const handleFileChange = (e) => {
 if (e.target.files && e.target.files[0]) {
 validateAndSetFile(e.target.files[0]);
 }
 };

 const validateAndSetFile = (selectedFile) => {
 const ext = selectedFile.name.split('.').pop().toLowerCase();
 if (ext !== 'pdf' && ext !== 'docx') {
 alert('Unsupported file format. Please upload PDF or DOCX.');
 return;
 }
 if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
 alert('File size exceeds the 10MB limit.');
 return;
 }
 setFile(selectedFile);
 };

 const handleSubmit = (e) => {
 e.preventDefault();
 if (!file) return;
 onAnalyze(file, jd);
 };

 return (
 <form onSubmit={handleSubmit} className="space-y-6">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Dropzone Area */}
 <div className="flex flex-col">
 <label className="text-sm font-semibold text-slate-500 mb-2">Resume File (PDF / DOCX)</label>
 <div
 onDragEnter={handleDrag}
 onDragOver={handleDrag}
 onDragLeave={handleDrag}
 onDrop={handleDrop}
 onClick={() => fileInputRef.current.click()}
 className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors duration-200 min-h-[220px] ${
 dragActive 
 ? 'border-blue-500 bg-blue-50/50 ' 
 : file 
 ? 'border-emerald-500 bg-emerald-50/10 ' 
 : 'border-slate-300 hover:border-blue-500 '
 }`}
 >
 <input
 ref={fileInputRef}
 type="file"
 className="hidden"
 accept=".pdf,.docx"
 onChange={handleFileChange}
 />
 {file ? (
 <div className="space-y-3">
 <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
 <div>
 <p className="text-sm font-bold text-slate-800 ">{file.name}</p>
 <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
 </div>
 <span className="text-xs text-blue-500 underline font-medium">Change file</span>
 </div>
 ) : (
 <div className="space-y-3">
 <Upload className="h-10 w-10 text-slate-400 mx-auto" />
 <div>
 <p className="text-sm font-medium text-slate-700 ">Drag & drop your resume here, or <span className="text-blue-500 underline">browse</span></p>
 <p className="text-xs text-slate-400 mt-1">Supports PDF, DOCX (Max 10MB)</p>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Job Description Textarea */}
 <div className="flex flex-col">
 <label htmlFor="jd-input" className="text-sm font-semibold text-slate-500 mb-2">
 Target Job Description (Optional)
 </label>
 <textarea
 id="jd-input"
 rows="8"
 placeholder="Paste target job description to match keywords, surface missing skills, and unlock custom AI feedback..."
 value={jd}
 onChange={(e) => setJd(e.target.value)}
 className="flex-1 w-full rounded-2xl border border-slate-300 bg-white p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none "
 />
 </div>
 </div>

 {error && (
 <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 ">
 <AlertCircle className="h-5 w-5 flex-shrink-0" />
 <p className="text-sm">{error}</p>
 </div>
 )}

 <button
 type="submit"
 disabled={!file || loading}
 className={`w-full py-4 rounded-xl text-sm font-bold text-white transition-all shadow-md cursor-pointer ${
 !file 
 ? 'bg-slate-300 cursor-not-allowed shadow-none' 
 : loading 
 ? 'bg-blue-400 cursor-wait' 
 : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] hover:shadow-lg'
 }`}
 >
 {loading ? 'Analyzing...' : 'Analyze & Score Resume'}
 </button>
 </form>
 );
}

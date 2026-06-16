import React, { useState, useEffect } from 'react';
import HistoryChart from '../components/HistoryChart';
import BreakdownChart from '../components/BreakdownChart';
import AtsGauge from '../components/AtsGauge';
import { getAdminUsers, getAdminUserHistory, getResumeBlob } from '../services/api';
import { Users, FileText, Calendar, Activity, Loader2, Eye, X, Download } from 'lucide-react';

export default function AdminDashboard() {
 const [users, setUsers] = useState([]);
 const [selectedUser, setSelectedUser] = useState(null);
 const [userHistory, setUserHistory] = useState([]);
 const [loadingUsers, setLoadingUsers] = useState(true);
 const [loadingHistory, setLoadingHistory] = useState(false);
 const [viewingResume, setViewingResume] = useState(null);
 const [resumeBlobUrl, setResumeBlobUrl] = useState(null);

 useEffect(() => {
 fetchUsers();
 }, []);

 const fetchUsers = async () => {
 setLoadingUsers(true);
 try {
 const data = await getAdminUsers();
 setUsers(data);
 } catch (err) {
 console.error('Failed to fetch users:', err);
 } finally {
 setLoadingUsers(false);
 }
 };

 const handleSelectUser = async (user) => {
 setSelectedUser(user);
 setLoadingHistory(true);
 try {
 const data = await getAdminUserHistory(user.id);
 setUserHistory(data);
 } catch (err) {
 console.error('Failed to fetch user history:', err);
 } finally {
 setLoadingHistory(false);
 }
 };

 const handleViewResume = async (analysisId, filename) => {
    try {
      const ext = filename.split('.').pop().toLowerCase();
      if (ext === 'docx') {
        // Fallback to download for DOCX
        const blob = await getResumeBlob(analysisId, 'download');
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // View PDF inline
        setViewingResume(filename);
        const blob = await getResumeBlob(analysisId, 'view');
        const url = window.URL.createObjectURL(blob);
        setResumeBlobUrl(url);
      }
    } catch (err) {
      console.error('Failed to fetch resume file:', err);
      alert('Could not retrieve file.');
    }
  };

  const closeResumeView = () => {
    if (resumeBlobUrl) {
      window.URL.revokeObjectURL(resumeBlobUrl);
    }
    setViewingResume(null);
    setResumeBlobUrl(null);
  };

 const latestAnalysis = userHistory.length > 0 ? userHistory[0] : null;

 return (
 <div className="flex flex-col lg:flex-row gap-6 h-full relative">
 {/* Users Sidebar */}
 <div className="w-full lg:w-1/3 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[40vh] lg:h-[80vh] min-h-[300px]">
 <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
 <h3 className="font-bold text-slate-800 flex items-center gap-2">
 <Users className="h-5 w-5 text-primary-600" />
 Registered Users
 </h3>
 <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2 py-1 rounded-full">
 {users.length}
 </span>
 </div>
 <div className="flex-1 overflow-y-auto p-2">
 {loadingUsers ? (
 <div className="flex justify-center py-8">
 <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
 </div>
 ) : users.length > 0 ? (
 <div className="space-y-1">
 {users.map(u => (
 <button
 key={u.id}
 onClick={() => handleSelectUser(u)}
 className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
 selectedUser?.id === u.id 
 ? 'bg-primary-50 border-l-4 border-primary-500' 
 : 'hover:bg-slate-50 border-l-4 border-transparent'
 }`}
 >
 <div className="flex-1 min-w-0">
 <p className={`text-sm font-semibold truncate ${selectedUser?.id === u.id ? 'text-primary-700 ' : 'text-slate-700 '}`}>
 {u.email}
 </p>
 <p className="text-xs text-slate-400 mt-0.5">
 Joined {new Date(u.createdAt).toLocaleDateString()}
 </p>
 </div>
 {u.role === 'admin' && (
 <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Admin</span>
 )}
 </button>
 ))}
 </div>
 ) : (
 <div className="text-center py-8 text-slate-500 text-sm">No users found.</div>
 )}
 </div>
 </div>

 {/* Details View */}
 <div className="w-full lg:w-2/3 flex flex-col gap-6">
 {!selectedUser ? (
 <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-8 text-center h-full min-h-[400px]">
 <div className="bg-slate-50 p-4 rounded-full mb-4">
 <Users className="h-8 w-8 text-slate-400" />
 </div>
 <h3 className="text-lg font-bold text-slate-700 ">Select a User</h3>
 <p className="text-sm text-slate-500 mt-2 max-w-sm">Choose a user from the sidebar to view their detailed scan history and most recent resume analysis.</p>
 </div>
 ) : loadingHistory ? (
 <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center h-full min-h-[400px]">
 <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
 </div>
 ) : (
 <>
 {/* User Summary Header */}
 <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
 <div>
 <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
 {selectedUser.email}
 </h2>
 <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
 <Activity className="h-4 w-4" /> {userHistory.length} total scans
 </p>
 </div>
 {latestAnalysis && (
 <div className="text-right">
 <p className="text-xs text-slate-400 font-semibold uppercase">Latest Score</p>
 <p className="text-3xl font-extrabold text-primary-600">{latestAnalysis.atsScore}%</p>
 </div>
 )}
 </div>

 {/* Latest Analysis Charts */}
 {latestAnalysis ? (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <AtsGauge score={latestAnalysis.atsScore} />
 <BreakdownChart breakdown={latestAnalysis.breakdown} />
 </div>
 ) : (
 <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-200 ">
 <FileText className="h-8 w-8 text-slate-400 mx-auto mb-3" />
 <p className="text-slate-600 font-medium">This user hasn't scanned any resumes yet.</p>
 </div>
 )}

 {/* History Table */}
 <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1">
 <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 ">
 <h3 className="font-bold text-slate-800 flex items-center gap-2">
 <Calendar className="h-5 w-5 text-slate-500" />
 Scan History
 </h3>
 </div>
 <div className="overflow-x-auto max-h-[400px]">
 <table className="w-full text-left text-sm">
 <thead className="sticky top-0 bg-white border-b border-slate-200 ">
 <tr className="text-slate-500 ">
 <th className="px-6 py-3 font-semibold">Filename</th>
 <th className="px-6 py-3 font-semibold">Date</th>
 <th className="px-6 py-3 font-semibold text-right">Score</th>
 <th className="px-6 py-3 font-semibold text-center">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {userHistory.map(item => (
 <tr key={item.id} className="hover:bg-slate-50">
 <td className="px-6 py-3 font-medium text-slate-800 max-w-[150px] truncate" title={item.filename}>
 {item.filename}
 </td>
 <td className="px-6 py-3 text-slate-500">
 {new Date(item.timestamp).toLocaleDateString()}
 </td>
 <td className="px-6 py-3 text-right font-bold text-slate-900 ">
 {item.atsScore}%
 </td>
 <td className="px-6 py-3 text-center">
    <button 
      onClick={() => handleViewResume(item.id, item.filename)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
    >
      <Eye className="h-3.5 w-3.5" /> View
    </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </>
 )}
 </div>
 
 {/* PDF Viewer Modal */}
 {viewingResume && (
   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-8">
     <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
       <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
         <h3 className="font-bold text-slate-800 flex items-center gap-2">
           <FileText className="h-5 w-5 text-primary-600" />
           {viewingResume}
         </h3>
         <button 
           onClick={closeResumeView}
           className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
         >
           <X className="h-5 w-5" />
         </button>
       </div>
       <div className="flex-1 bg-slate-100 relative">
         {resumeBlobUrl ? (
           <iframe 
             src={resumeBlobUrl} 
             className="w-full h-full border-0" 
             title="Resume Viewer"
           />
         ) : (
           <div className="absolute inset-0 flex items-center justify-center">
             <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
           </div>
         )}
       </div>
     </div>
   </div>
 )}
 </div>
 );
}

import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Layout from './components/Layout';
import AtsGauge from './components/AtsGauge';
import HistoryChart from './components/HistoryChart';
import BreakdownChart from './components/BreakdownChart';
import UploadForm from './components/UploadForm';
import BulletOptimizer from './components/BulletOptimizer';
import { getHistory, analyzeResume } from './services/api';
import { 
  FileText, 
  Users, 
  TrendingUp, 
  Award,
  AlertTriangle,
  RefreshCw,
  Mail,
  User,
  CheckCircle2,
  Calendar,
  Briefcase
} from 'lucide-react';

function DashboardApp() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [history, setHistory] = useState([]);
  const [lastAnalysis, setLastAnalysis] = useState(() => {
    const saved = localStorage.getItem('last_analysis');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleAnalyze = async (file, jd) => {
    setLoading(true);
    setApiError(null);
    try {
      const result = await analyzeResume(file, jd);
      setLastAnalysis(result);
      localStorage.setItem('last_analysis', JSON.stringify(result));
      // Refresh history list
      await fetchHistory();
    } catch (err) {
      console.error('Analysis failed:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'An unexpected error occurred during analysis.';
      setApiError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Stats computation
  const totalScanned = history.length;
  const avgScore = totalScanned > 0 
    ? Math.round(history.reduce((sum, item) => sum + (item.atsScore || 0), 0) / totalScanned) 
    : 0;
  const highestScore = totalScanned > 0
    ? Math.max(...history.map(item => item.atsScore || 0))
    : 0;

  // Grade badge helper
  const getGradeBadge = (score) => {
    if (score < 50) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400">Needs Work</span>;
    }
    if (score < 80) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400">Competitive</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">Excellent</span>;
  };

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView}>
      {currentView === 'dashboard' ? (
        <div className="space-y-8">
          {/* Welcome Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-linear-to-r from-blue-600 to-indigo-700 rounded-3xl text-white shadow-md">
            <div>
              <h2 className="text-2xl font-bold">Welcome to your Premium Portal</h2>
              <p className="text-blue-100 mt-1 text-sm">Upload, optimize, and track resumes in real-time using advanced AI analysis.</p>
            </div>
            <button 
              onClick={() => setCurrentView('analyze')}
              className="self-start md:self-auto px-5 py-2.5 bg-white text-blue-600 rounded-xl text-sm font-bold shadow-xs hover:bg-slate-50 transition-transform active:scale-[0.98] cursor-pointer"
            >
              Scan New Resume
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase">Total Scanned</span>
                <span className="text-2xl font-extrabold">{totalScanned}</span>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase">Average ATS Score</span>
                <span className="text-2xl font-extrabold">{avgScore}</span>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-950/40 rounded-xl text-purple-600 dark:text-purple-400">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase">Highest Match</span>
                <span className="text-2xl font-extrabold">{highestScore}%</span>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase">Latest Resume</span>
                <span className="text-sm font-bold truncate max-w-[140px] block mt-0.5">
                  {lastAnalysis ? lastAnalysis.filename : 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HistoryChart history={history} />
            <BreakdownChart breakdown={lastAnalysis?.breakdown} />
          </div>

          {/* Recent Analysis Summary Card */}
          {lastAnalysis ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Most Recent Candidate Profile Summary
                </h3>
                <span className="text-xs text-slate-400 font-medium">Filename: {lastAnalysis.filename}</span>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Details list */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-sm">
                    <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span className="font-semibold text-slate-500 w-24">Name:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{lastAnalysis.parsedDetails?.name || 'Not extracted'}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span className="font-semibold text-slate-500 w-24">Email:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{lastAnalysis.parsedDetails?.email || 'Not extracted'}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Briefcase className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span className="font-semibold text-slate-500 w-24">Experience:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {lastAnalysis.parsedDetails?.experienceYears !== undefined 
                        ? `${lastAnalysis.parsedDetails.experienceYears} Years` 
                        : 'Not extracted'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-400 block uppercase">Identified Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {lastAnalysis.parsedDetails?.skills && lastAnalysis.parsedDetails.skills.length > 0 ? (
                        lastAnalysis.parsedDetails.skills.map((skill, index) => (
                          <span key={index} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs font-medium border border-blue-100 dark:border-blue-900/30">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No skills identified.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Missing skills list */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-red-500 dark:text-red-400 block uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      Missing Core Skills (Gaps identified)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {lastAnalysis.geminiFeedback?.missingSkills && lastAnalysis.geminiFeedback.missingSkills.length > 0 ? (
                        lastAnalysis.geminiFeedback.missingSkills.map((skill, index) => (
                          <span key={index} className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-xs font-medium border border-red-100 dark:border-red-900/30">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-500 font-medium bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded border border-emerald-100 dark:border-emerald-900/20 inline-block">
                          No missing skills found. Great match!
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 block uppercase">Overall Match Comments</span>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-100 dark:border-slate-900">
                      {lastAnalysis.geminiFeedback?.overallFeedback || 'No feedback comments generated.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3">
              <p className="text-slate-500 dark:text-slate-400 font-medium">No recent analysis data available on this client.</p>
              <button 
                onClick={() => setCurrentView('analyze')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
              >
                Analyze Your First Resume Now
              </button>
            </div>
          )}

          {/* History Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Scan History Table
              </h3>
              <button 
                onClick={() => fetchHistory(true)}
                disabled={refreshing}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-3.5 font-bold">Filename</th>
                    <th className="px-6 py-3.5 font-bold">Scan Date</th>
                    <th className="px-6 py-3.5 font-bold">ATS Score</th>
                    <th className="px-6 py-3.5 font-bold">Status Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.length > 0 ? (
                    history.map((item) => (
                      <tr 
                        key={item.id} 
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200 max-w-[240px] truncate">{item.filename}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {new Date(item.timestamp).toLocaleString(undefined, { 
                            dateStyle: 'medium', 
                            timeStyle: 'short' 
                          })}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-950 dark:text-white">{item.atsScore}%</td>
                        <td className="px-6 py-4">{getGradeBadge(item.atsScore)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-400">No uploads recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Analyze Module */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xs">
            <h2 className="text-xl font-bold mb-2">Scan & Score Resume</h2>
            <p className="text-sm text-slate-400 mb-6">Compare a candidate resume file against specific job description requirements to extract optimization tips.</p>
            <UploadForm onAnalyze={handleAnalyze} loading={loading} error={apiError} />
          </div>

          {/* Loading States / Skeletons */}
          {loading && (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl col-span-2" />
              </div>
              <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            </div>
          )}

          {/* Results Output */}
          {!loading && lastAnalysis && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                <AtsGauge score={lastAnalysis.atsScore} />
                <div className="lg:col-span-2">
                  <BreakdownChart breakdown={lastAnalysis.breakdown} />
                </div>
              </div>

              {/* Text Feedback & Missing Skills Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Feedback Card */}
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    Overall AI Feedback
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {lastAnalysis.geminiFeedback?.overallFeedback || 'Omitted job description analysis.'}
                  </p>
                </div>

                {/* Missing Skills Card */}
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Missing Skills Gaps
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {lastAnalysis.geminiFeedback?.missingSkills && lastAnalysis.geminiFeedback.missingSkills.length > 0 ? (
                      lastAnalysis.geminiFeedback.missingSkills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-xs font-semibold border border-red-100 dark:border-red-900/30">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                        No missing skills identified! Great candidate matching.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bullet Points Optimizer Panel */}
              <BulletOptimizer optimizations={lastAnalysis.geminiFeedback?.bulletPointOptimizations} />
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DashboardApp />
    </ThemeProvider>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, KeyRound, Loader2, ArrowRight } from 'lucide-react';

export default function Auth() {
 const { requestOtp, verifyOtp } = useAuth();
 
 const [step, setStep] = useState('email'); // 'email' | 'otp'
 const [email, setEmail] = useState('');
 const [otp, setOtp] = useState('');
 
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');

 const handleRequestOtp = async (e) => {
 e.preventDefault();
 setLoading(true);
 setError('');
 try {
 await requestOtp(email);
 setStep('otp');
 } catch (err) {
 setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
 } finally {
 setLoading(false);
 }
 };

 const handleVerifyOtp = async (e) => {
 e.preventDefault();
 setLoading(true);
 setError('');
 try {
 await verifyOtp(email, otp);
 // AuthContext will update state and route to dashboard
 } catch (err) {
 setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
 <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
 <h2 className="mt-6 text-3xl font-extrabold text-slate-900">ATS by srebuilds.tech</h2>
 <p className="mt-2 text-sm text-slate-600">Secure, passwordless access</p>
 </div>

 <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
 <div className="bg-white py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border border-slate-200">
 
 {error && (
 <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
 {error}
 </div>
 )}

 {step === 'email' ? (
 <form onSubmit={handleRequestOtp} className="space-y-6">
 <div>
 <label htmlFor="email" className="block text-sm font-medium text-slate-700">
 Email address
 </label>
 <div className="mt-1 relative rounded-md shadow-sm">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Mail className="h-5 w-5 text-slate-400" />
 </div>
 <input
 id="email"
 name="email"
 type="email"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
 placeholder="you@example.com"
 />
 </div>
 </div>

 <div>
 <button
 type="submit"
 disabled={loading || !email}
 className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
 >
 {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Continue with Email'}
 </button>
 </div>
 </form>
 ) : (
 <form onSubmit={handleVerifyOtp} className="space-y-6">
 <div>
 <p className="text-sm text-slate-600 mb-4">
 We sent a 6-digit verification code to <span className="font-semibold text-slate-900">{email}</span>.
 </p>
 <label htmlFor="otp" className="block text-sm font-medium text-slate-700">
 Verification Code
 </label>
 <div className="mt-1 relative rounded-md shadow-sm">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <KeyRound className="h-5 w-5 text-slate-400" />
 </div>
 <input
 id="otp"
 name="otp"
 type="text"
 required
 maxLength={6}
 value={otp}
 onChange={(e) => setOtp(e.target.value)}
 className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-center tracking-widest text-lg font-mono text-slate-900 bg-white"
 placeholder="000000"
 />
 </div>
 </div>

 <div>
 <button
 type="submit"
 disabled={loading || otp.length < 6}
 className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
 >
 {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
 <>Verify & Sign In <ArrowRight className="h-4 w-4" /></>
 )}
 </button>
 </div>
 
 <div className="text-center mt-4">
 <button 
 type="button" 
 onClick={() => setStep('email')}
 className="text-sm text-primary-600 hover:text-primary-500"
 >
 Use a different email
 </button>
 </div>
 </form>
 )}
 </div>
 </div>
 </div>
 );
}

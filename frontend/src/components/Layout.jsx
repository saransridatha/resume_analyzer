import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
 LayoutDashboard, 
 UploadCloud, 
 Sun, 
 Moon, 
 Menu, 
 X,
 FileText,
 Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout({ children, currentView, setCurrentView }) {
 const { theme, toggleTheme } = useTheme();
 const { user, logout } = useAuth();
 const [isMobileOpen, setIsMobileOpen] = useState(false);

 const menuItems = [
 { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
 { id: 'analyze', name: 'Analyze Resume', icon: UploadCloud },
 ];

 if (user?.role === 'admin') {
 menuItems.push({ id: 'admin', name: 'Admin Panel', icon: Users });
 }

 return (
 <div className="min-h-screen flex bg-slate-50 text-slate-900 ">
 {/* Desktop Sidebar */}
 <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white ">
 <div className="h-16 flex items-center px-6 border-b border-slate-200 ">
 <FileText className="h-6 w-6 text-blue-600 mr-2" />
 <span className="font-bold text-lg">ATS Optimizer</span>
 </div>
 <nav className="flex-1 px-4 py-6 space-y-1">
 {menuItems.map(item => (
 <button
 key={item.id}
 onClick={() => setCurrentView(item.id)}
 className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
 currentView === item.id 
 ? 'bg-primary-50 text-primary-700 ' 
 : 'text-slate-600 hover:bg-slate-50 :bg-slate-800/50'
 }`}
 >
 <item.icon className="h-5 w-5 mr-3" />
 {item.name}
 </button>
 ))}
 </nav>
 <div className="p-4 border-t border-slate-200 ">
 <button 
 onClick={toggleTheme}
 className="w-full flex items-center justify-between px-4 py-2 border border-slate-200 rounded-lg text-sm cursor-pointer"
 >
 <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
 {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
 </button>
 </div>
 </aside>

 {/* Mobile Drawer (AnimatePresence) */}
 <AnimatePresence>
 {isMobileOpen && (
 <>
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 0.5 }}
 exit={{ opacity: 0 }}
 onClick={() => setIsMobileOpen(false)}
 className="fixed inset-0 z-40 bg-black md:hidden"
 />
 <motion.aside 
 initial={{ x: '-100%' }}
 animate={{ x: 0 }}
 exit={{ x: '-100%' }}
 transition={{ type: 'spring', damping: 25 }}
 className="fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col md:hidden shadow-xl"
 >
 <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 ">
 <div className="flex items-center">
 <FileText className="h-6 w-6 text-blue-600 mr-2" />
 <span className="font-bold text-lg">ATS Optimizer</span>
 </div>
 <button onClick={() => setIsMobileOpen(false)}>
 <X className="h-5 w-5" />
 </button>
 </div>
 <nav className="flex-1 px-4 py-6 space-y-1">
 {menuItems.map(item => (
 <button
 key={item.id}
 onClick={() => {
 setCurrentView(item.id);
 setIsMobileOpen(false);
 }}
 className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
 currentView === item.id 
 ? 'bg-primary-50 text-primary-700 ' 
 : 'text-slate-600 hover:bg-slate-50 :bg-slate-800/50'
 }`}
 >
 <item.icon className="h-5 w-5 mr-3" />
 {item.name}
 </button>
 ))}
 </nav>
 <div className="p-4 border-t border-slate-200 ">
 <button 
 onClick={toggleTheme}
 className="w-full flex items-center justify-between px-4 py-2 border border-slate-200 rounded-lg text-sm cursor-pointer"
 >
 <span>Toggle Theme</span>
 {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
 </button>
 </div>
 </motion.aside>
 </>
 )}
 </AnimatePresence>

 {/* Main Content Area */}
 <div className="flex-1 flex flex-col min-w-0">
 <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-8">
 <button 
 onClick={() => setIsMobileOpen(true)}
 className="md:hidden p-2 -ml-2 text-slate-600 cursor-pointer"
 >
 <Menu className="h-6 w-6" />
 </button>
 <div className="hidden md:block">
 <h1 className="text-xl font-semibold capitalize">{currentView === 'dashboard' ? 'Dashboard' : 'Analyze Resume'}</h1>
 </div>
 <div className="flex items-center space-x-4">
 <span className="hidden sm:inline text-sm font-semibold text-slate-700 ">
 Welcome, <span className="text-primary-700 ">{user?.email}</span>
 </span>
 <span className="text-xs px-2 py-1 bg-primary-100 text-primary-800 rounded font-semibold uppercase tracking-wider">
 {user?.role === 'admin' ? 'Admin' : 'Premium'}
 </span>
 <button 
 onClick={logout}
 className="text-sm font-bold text-slate-500 hover:text-slate-700 :text-slate-200 ml-2"
 >
 Logout
 </button>
 </div>
 </header>
 <main className="flex-1 overflow-auto p-4 md:p-8 max-w-7xl w-full mx-auto">
 {children}
 </main>
 </div>
 </div>
 );
}

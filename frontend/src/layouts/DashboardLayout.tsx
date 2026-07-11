import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  MapPin,
  Share2,
  MessageSquareCode,
  FileSpreadsheet,
  Settings,
  Menu,
  X,
  Bell,
  BrainCircuit,
  Search,
  LogOut,
  UserCheck
} from 'lucide-react';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'Crime Analytics', path: '/analytics', icon: <BarChart3 className="h-5 w-5" /> },
    { name: 'Heatmap', path: '/heatmap', icon: <MapPin className="h-5 w-5" /> },
    { name: 'Criminal Network', path: '/criminal-network', icon: <Share2 className="h-5 w-5" /> },
    { name: 'Repeat Offenders', path: '/repeat-offenders', icon: <UserCheck className="h-5 w-5" /> },
    { name: 'AI Assistant', path: '/ai-assistant', icon: <MessageSquareCode className="h-5 w-5" /> },
    { name: 'Predictions', path: '/predictions', icon: <BrainCircuit className="h-5 w-5" /> },
    { name: 'Reports', path: '/reports', icon: <FileSpreadsheet className="h-5 w-5" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleColor = (role?: string) => {
    if (role === 'Admin') return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (role === 'Investigation Officer') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'; // Crime Analyst
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="K-CRIME Logo" className="h-8 w-8 object-contain rounded-md bg-[#FFFFFF] border border-[#D6DCE5] p-0.5" />
          <span className="font-bold text-sm tracking-tight text-[#1C2833] uppercase">K-CRIME</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar - Desktop and Sliding Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="K-CRIME Logo" className="h-10 w-10 object-contain rounded-lg bg-[#FFFFFF] border border-[#D6DCE5] p-1 shadow-[0_2px_8px_rgba(0,0,0,0.08)]" />
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">K-CRIME</span>
              <span className="block text-[8px] text-indigo-400 font-bold uppercase tracking-widest">Karnataka Police Intelligence</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-950 hover:text-white'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Profile Card */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
              {user?.username?.substring(0, 2).toUpperCase() || 'SP'}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-white truncate">{user?.name || 'Police Officer'}</span>
              <span className="block text-[9px] font-semibold text-indigo-400 uppercase tracking-wider truncate">{user?.role || 'KSP Staff'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header Bar */}
        <header className="h-16 px-6 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between shrink-0 sticky top-0 z-30">
          {/* Left: Search Bar placeholder */}
          <div className="relative w-72 hidden md:block">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search criminal database or FIRs..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800/80 focus:border-indigo-500 text-xs text-white placeholder-slate-600 outline-none transition-all"
            />
          </div>
          <div className="md:hidden"></div>

          {/* Right: Notifications, Role, Logout */}
          <div className="flex items-center gap-4">
            
            {/* Notifications Bell */}
            <button className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-400 hover:text-white relative hover:scale-105 active:scale-95 transition-all">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500"></span>
            </button>

            {/* Role Badge */}
            {user && (
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getRoleColor(user.role)} hidden sm:inline-block`}>
                {user.role}
              </span>
            )}

            {/* Divider */}
            <div className="h-4 w-px bg-slate-800"></div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800/80 hover:bg-red-950/20 hover:text-red-400 text-xs text-slate-400 font-semibold active:scale-95 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>

          </div>
        </header>

        {/* Dynamic page container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {children}
        </main>

      </div>
    </div>
  );
};

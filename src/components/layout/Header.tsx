import React from 'react';
import { Menu, X, Bell, User, Flame } from 'lucide-react';
import { UserStats } from '../../types';

interface HeaderProps {
  activeTab: string;
  onNavigate: (tab: any) => void;
  stats: UserStats;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  onNavigate, 
  stats, 
  mobileMenuOpen, 
  setMobileMenuOpen 
}) => {
  return (
    <header className="shadow-sm bg-white flex justify-between items-center w-full px-4 sm:px-6 lg:px-8 py-3 shrink-0 border-b border-slate-200 z-20">
      <div className="flex items-center gap-4">
        <button 
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <h1 className="font-headline text-2xl font-black text-indigo-600 leading-none tracking-tight">
          SignMentor
        </h1>

        <nav className="hidden md:flex items-center ml-8 space-x-4 text-sm font-semibold text-slate-600 font-headline">
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 ${activeTab === 'dashboard' ? 'text-slate-900 font-bold bg-slate-100' : ''}`}
          >
            Browse
          </button>
          <button 
            onClick={() => onNavigate('lessons')}
            className={`transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 ${activeTab === 'lessons' ? 'text-indigo-600 font-bold bg-indigo-50' : ''}`}
          >
            Lessons
          </button>
          <button 
            onClick={() => onNavigate('practice')}
            className={`transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 ${activeTab === 'practice' ? 'text-slate-900 font-bold bg-slate-100' : ''}`}
          >
            Community Practice
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={() => onNavigate('profile')}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all active:scale-95 flex items-center gap-1 font-semibold text-xs border border-slate-200"
        >
          <Flame className="w-4 h-4 text-orange-500 fill-orange-500 shrink-0" />
          <span className="text-slate-800 font-bold hidden sm:inline">{stats.streakDays} Day Streaks</span>
        </button>
        
        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all active:scale-95">
          <Bell className="w-5 h-5" />
        </button>
        
        <button 
          onClick={() => onNavigate('profile')}
          className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center hover:brightness-95 active:scale-95 shadow-sm border border-slate-200"
        >
          {stats.xp > 0 ? 'A' : <User className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
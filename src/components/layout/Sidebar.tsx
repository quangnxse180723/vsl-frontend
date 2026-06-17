import React from 'react';
import { LayoutDashboard, BookOpen, Brain, User, Settings, HelpCircle } from 'lucide-react';
import { UserStats } from '../../types';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: any) => void;
  stats: UserStats;
  onStartDailyChallenge: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onNavigate, 
  stats, 
  onStartDailyChallenge 
}) => {
  const xpInLevel = stats.xp % 200;
  const progress = (xpInLevel / 200) * 100;

  return (
    <aside className="hidden md:flex flex-col w-72 bg-white p-5 space-y-5 border-r border-slate-200 shrink-0 overflow-y-auto select-none">
      {/* Learning path xp meter */}
      <div className="px-3 py-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Learning Path</h2>
        <div className="mt-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="font-headline font-bold text-sm text-slate-800 truncate">Level {stats.level} Beginner</p>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{stats.xp} Total XP earned</p>
          </div>
        </div>
        
        <div className="mt-4 space-y-1">
          <div className="bg-slate-100 rounded-full h-1.5 w-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 block text-right mt-1">
            {xpInLevel} / 200 XP to next level
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 text-sm font-semibold">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'lessons', label: 'Lessons', icon: BookOpen },
          { id: 'practice', label: 'AI Practice', icon: Brain },
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'admin', label: 'Admin', icon: Settings },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === item.id 
                ? (item.id === 'lessons' ? 'bg-indigo-600 text-white font-bold shadow-md' : 'bg-indigo-50 text-indigo-700 font-bold') 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button 
        type="button"
        onClick={onStartDailyChallenge}
        className="w-full bg-indigo-600 text-white py-3.5 px-4 rounded-xl font-bold whitespace-nowrap shadow-md hover:bg-indigo-700 active:scale-95 transition-all text-xs"
      >
        Start Daily Challenge
      </button>

      <div className="pt-4 border-t border-slate-200 space-y-1 text-xs font-semibold text-slate-500">
        <button 
          onClick={() => onNavigate('admin')}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-50"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </button>
        <button 
          onClick={() => alert("Welcome to SignMentor help portal!")}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-50"
        >
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Help</span>
        </button>
      </div>
    </aside>
  );
};
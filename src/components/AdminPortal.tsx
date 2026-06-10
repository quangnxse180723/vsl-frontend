/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, BookOpen, Activity, CheckCircle, Upload, Plus, 
  MoreVertical, Search, Bell, ChevronDown, Check, Trash2
} from 'lucide-react';
import { Lesson, QuizQuestion } from '../types';

interface AdminPortalProps {
  lessons: Lesson[];
  onAddCustomLesson: (newLesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
}

export default function AdminPortal({ lessons, onAddCustomLesson, onDeleteLesson }: AdminPortalProps) {
  const [quickSignName, setQuickSignName] = useState<string>('');
  const [quickCategory, setQuickCategory] = useState<string>('Basic');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Initial user list data
  const [users, setUsers] = useState([
    { name: 'Felix Chen', email: 'felix@example.com', status: 'Active', proficiency: 55, lastActive: '2 mins ago', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop' },
    { name: 'Sara Jenkins', email: 'sara.j@work.com', status: 'Idle', proficiency: 30, lastActive: '1 hour ago', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop' },
    { name: 'Marcus Thorne', email: 'm.thorne@edu.com', status: 'Active', proficiency: 40, lastActive: 'Just now', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop' }
  ]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSignName.trim()) return;

    // Create a high-quality Lesson from quick vocabulary inputs
    const newId = `custom_${Date.now()}`;
    const newLesson: Lesson = {
      id: newId,
      title: `Sign: ${quickSignName}`,
      category: quickCategory,
      difficulty: 'Beginner',
      progress: 0,
      status: 'Not Started',
      imageUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=640&auto=format&fit=crop', // default vocabulary training thumbnail
      description: `Practice the handshape gesture coordinates for the term "${quickSignName}" dynamically in real-time.`,
      signGuide: `Keep your hand comfortable. Present the spelling nodes for "${quickSignName}" securely with confident transitions.`,
      steps: [
        'Place your hand near your shoulder at steady chest height.',
        `Carefully model the hand shape representing "${quickSignName}".`,
        'Form structural alignment coordinates, hold for 1.5 seconds.'
      ],
      letterTarget: quickSignName.charAt(0).toUpperCase() || 'A',
      quizQuestions: [
        {
          id: `q_${newId}_1`,
          type: 'meaning',
          question: `What represents the main hand shape for the term "${quickSignName}"?`,
          options: [
            `Forming standard coordinates matching ${quickSignName}`,
            'Waving hand randomly above your level',
            'Closing fingers fully into a circle',
            'Bouncing the wrist continuously to signal attention'
          ],
          correctAnswer: `Forming standard coordinates matching ${quickSignName}`
        }
      ]
    };

    onAddCustomLesson(newLesson);
    setSuccessMsg(`"${quickSignName}" vocabulary added!`);
    setQuickSignName('');
    setTimeout(() => {
      setSuccessMsg('');
    }, 3000);
  };

  // Static/dynamic calculations for accuracy tracking
  const points = [
    { label: 'Mon', level: '70%', val: 70 },
    { label: 'Tue', level: '60%', val: 60 },
    { label: 'Wed', level: '90%', val: 90 },
    { label: 'Thu', level: '80%', val: 80 },
    { label: 'Fri', level: '45%', val: 45 }
  ];

  // Exclude non-custom items or list customized additions in RECENT ADDITIONS
  const customAdditions = lessons.filter(l => l.id.startsWith('custom_'));

  return (
    <div className="space-y-lg animate-fade-in text-on-surface">
      
      {/* HEADER BAR WITH SEARCH INPUT (AS SPECIFIED IN PHOTO 1) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md pb-md border-b border-outline-variant/30">
        <div>
          <h2 className="font-headline text-2xl font-extrabold text-[#3F51B5] tracking-tight">
            Admin Console
          </h2>
          <p className="text-xs text-on-surface-variant font-medium mt-1">
            Real-time control tower of user performance indexes, active processes, and material libraries.
          </p>
        </div>
        
        {/* Search tool block and Notification bells */}
        <div className="flex items-center gap-md shrink-0">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search analytics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#F3F4FB] text-xs font-semibold rounded-full border border-transparent focus:border-primary/20 outline-none w-56 transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
          </div>
          
          <button 
            type="button" 
            onClick={() => alert('All backend engines are fully initialized and operating inside secure containers.')}
            className="p-2 bg-[#F3F4FB] hover:bg-[#E6E8F7] rounded-full relative transition-all active:scale-95"
          >
            <Bell className="w-4 h-4 text-[#3F51B5]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div className="w-8 h-8 rounded-full bg-[#3F51B5] text-white font-extrabold text-xs flex items-center justify-center shadow">
            A
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-md flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-sm">
            <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
            <span className="font-bold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:underline font-bold text-[10px]">Dismiss</button>
        </div>
      )}

      {/* PRIMARY WORKSPACE METRICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        
        {/* BIG CHART CARD: AI Accuracy Trends inside a beautiful container */}
        <div className="lg:col-span-2 bg-white border border-outline-variant/60 rounded-3xl p-lg space-y-md shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-headline text-md font-bold text-on-surface">
                  AI Accuracy Trends
                </h3>
                <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                  Model confidence across all active users this month
                </p>
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-xs">
                <span className="text-[10px] uppercase font-bold text-white bg-[#5C6BC0] px-2.5 py-1 rounded-full tracking-wider">
                  Real-time
                </span>
                <span className="text-[10px] uppercase font-bold text-white bg-[#3F51B5] px-2.5 py-1 rounded-full tracking-wider">
                  98.4% Confidence
                </span>
              </div>
            </div>
          </div>

          {/* CUSTOM WAVE CHART VECTOR CANVAS */}
          <div className="relative h-44 w-full bg-[#f8f9fe] border border-outline-variant/35 rounded-2xl overflow-hidden mt-2 shrink-0 flex flex-col justify-end">
            
            {/* Grid Line lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-sm pointer-events-none opacity-40">
              <div className="border-b border-dashed border-primary/10 w-full h-[1px]" />
              <div className="border-b border-dashed border-primary/10 w-full h-[1px]" />
              <div className="border-b border-dashed border-primary/10 w-full h-[1px]" />
              <div className="border-b border-dashed border-primary/10 w-full h-[1px]" />
            </div>

            {/* Glowing SVG Wave Underlay matches exact graphic in image 1 */}
            <svg viewBox="0 0 500 120" className="absolute bottom-0 left-0 right-0 w-full h-24 overflow-visible pointer-events-none">
              <defs>
                <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7986CB" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#3F51B5" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              {/* Complex bezier waves */}
              <path 
                d="M 0,20 C 50,30 100,5 150,35 C 200,60 250,15 300,50 C 350,85 410,40 500,60 L 500,120 L 0,120 Z" 
                fill="url(#waveGrad)"
              />
              <path 
                d="M 0,20 C 50,30 100,5 150,35 C 200,60 250,15 300,50 C 350,85 410,40 500,60" 
                fill="none" 
                stroke="#5C6BC0" 
                strokeWidth="1.5"
                className="opacity-70"
              />
            </svg>

            {/* Vertical Bar Poles precisely aligned */}
            <div className="absolute inset-x-lg top-sm bottom-md flex justify-between items-end">
              {points.map((pt, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end relative group">
                  
                  {/* Tooltip on Hover */}
                  <span className="absolute -top-6 text-[10px] font-bold font-mono bg-[#3F51B5] text-white px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">
                    {pt.level}
                  </span>

                  {/* Vertical bar line */}
                  <div 
                    className="w-[2.5px] bg-[#3F51B5]/30 group-hover:bg-[#3F51B5]/60 transition-colors rounded-t"
                    style={{ height: `${pt.val}%` }}
                  />

                  {/* Dot point indicator */}
                  <div 
                    className="w-2.5 h-2.5 rounded-full border-2 border-white bg-[#3F51B5] shadow absolute bottom-0 -mb-1"
                    style={{ bottom: `${pt.val}%` }}
                  />
                  
                  <span className="text-[11px] font-bold text-outline mt-2 absolute bottom-[-22px]">
                    {pt.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Empty base pad spacer */}
            <div className="h-6 w-full shrink-0" />
          </div>

        </div>

        {/* RIGHT COLUMN: Stacked static & system diagnostics widgets */}
        <div className="space-y-md flex flex-col justify-between">
          
          {/* Active Users Widget */}
          <div className="bg-white border border-outline-variant/60 rounded-3xl p-md flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold font-mono text-outline uppercase tracking-wider block">
                ACTIVE USERS
              </span>
              <h4 className="text-2xl font-black text-on-surface">12.4k</h4>
              <p className="text-[11px] text-emerald-600 font-extrabold flex items-center gap-0.5">
                <span>+12% this week</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#E8EAF6] text-[#3F51B5] flex items-center justify-center">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          {/* Lessons completed tracking widget */}
          <div className="bg-white border border-outline-variant/60 rounded-3xl p-md flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold font-mono text-outline uppercase tracking-wider block">
                LESSONS COMPLETED
              </span>
              <h4 className="text-2xl font-black text-on-surface">84k</h4>
              <p className="text-[11px] text-[#3F51B5] font-extrabold flex items-center gap-0.5">
                <span>+5.4k today</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#E8EAF6] text-[#3F51B5] flex items-center justify-center">
              <BookOpen className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          {/* System status diagnostic widget (blue gradient style) */}
          <div className="bg-gradient-to-br from-[#3F51B5] to-[#283593] text-white rounded-3xl p-md flex items-center justify-between shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
            <div className="space-y-1 z-10">
              <span className="text-[10px] font-bold font-mono text-white/70 uppercase tracking-widest block">
                SYSTEM HEALTH
              </span>
              <h4 className="text-2xl font-black text-white tracking-tight">Optimal</h4>
              <p className="text-[11px] text-white/80 font-semibold">
                All services running
              </p>
            </div>
            <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0 z-10 border border-white/20">
              <CheckCircle className="w-5 h-5 text-white fill-white/10" />
            </div>
          </div>

        </div>

      </div>

      {/* ROW 2: USER MANAGEMENT & CONTENT MANAGEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg pt-sm">
        
        {/* Column 1: Core User Registry table */}
        <div className="lg:col-span-2 bg-white border border-outline-variant/60 rounded-3xl p-lg space-y-md shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-bold text-md text-on-surface">
              User Management
            </h3>
            <button 
              type="button"
              onClick={() => alert('Search and filter criteria applied! Directing to standard full ledger.')}
              className="text-xs font-bold text-[#3F51B5] flex items-center gap-1 hover:underline"
            >
              <span>View All</span>
              <span>&rarr;</span>
            </button>
          </div>

          {/* Custom table styled beautifully */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-[#F0F2FA] text-[10px] font-extrabold text-[#959CB5] tracking-widest uppercase">
                  <th className="py-3 px-1">USER</th>
                  <th className="py-3 px-2">STATUS</th>
                  <th className="py-3 px-2 text-center">PROFICIENCY</th>
                  <th className="py-3 px-2">LAST ACTIVE</th>
                  <th className="py-3 px-1">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F6F8FC] text-xs font-semibold">
                {users.map((usr, i) => (
                  <tr key={i} className="hover:bg-[#FAFAFD] transition-colors group">
                    {/* User profile with small subtitle */}
                    <td className="py-3.5 px-1 flex items-center gap-sm">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant shrink-0">
                        <img 
                          alt={usr.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          src={usr.image} 
                        />
                      </div>
                      <div>
                        <h5 className="font-bold text-on-surface">{usr.name}</h5>
                        <span className="text-[10px] text-outline block">{usr.email}</span>
                      </div>
                    </td>

                    {/* Active/Idle Badge pill */}
                    <td className="py-3.5 px-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        usr.status === 'Active' 
                          ? 'bg-[#E8EAF6] text-[#3F51B5]' 
                          : 'bg-[#F3F4FB] text-[#7E88AC]'
                      }`}>
                        {usr.status}
                      </span>
                    </td>

                    {/* Progress track custom */}
                    <td className="py-3.5 px-2 text-center">
                      <div className="flex items-center gap-sm max-w-[120px] mx-auto">
                        <div className="bg-[#E8EAF6] rounded-full h-1.5 w-full overflow-hidden">
                          <div 
                            className="bg-[#3F51B5] h-full rounded-full transition-all"
                            style={{ width: `${usr.proficiency}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-outline shrink-0">{usr.proficiency}%</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-2 text-[#7E88AC]">
                      {usr.lastActive}
                    </td>

                    <td className="py-3.5 px-1">
                      <button 
                        onClick={() => alert(`Operational controls for ${usr.name} are locked. Please contact IT root administrator.`)}
                        className="p-1 px-1.5 text-outline hover:text-on-surface hover:bg-[#F3F4FB] rounded transition-all cursor-pointer"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Content Management widget side panel */}
        <div className="bg-white border border-outline-variant/60 rounded-3xl p-lg space-y-md shadow-sm">
          <h3 className="font-headline font-bold text-md text-on-surface">
            Content Management
          </h3>

          {/* Dotted Upload Card mockup */}
          <div className="border border-dashed border-[#C5CAE9] bg-[#FAFAFD] rounded-2xl p-md text-center py-5 hover:bg-[#F3F4FB] transition-all cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#3F51B5] shadow-xs mx-auto border border-[#E8EAF6] mb-2">
              <Upload className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-on-surface leading-tight">Uploader</h4>
            <p className="text-[10px] text-outline font-semibold mt-0.5">MP4 or WEBM, max 50MB</p>
          </div>

          {/* Quick Add Form connected with curriculum stats actions */}
          <form onSubmit={handleQuickAdd} className="space-y-xs">
            <span className="text-[9px] font-mono font-black text-outline uppercase tracking-wider block">
              QUICK ADD VOCABULARY
            </span>
            <div className="space-y-sm pt-xs">
              <input 
                type="text" 
                required
                placeholder="Sign Name (e.g., 'Hello')"
                value={quickSignName}
                onChange={(e) => setQuickSignName(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 bg-[#F3F4FB] border border-[#E5E7EB] focus:bg-white focus:border-[#3F51B5] outline-none rounded-xl"
              />
              
              <div className="flex gap-sm items-center">
                <div className="relative flex-1">
                  <select 
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 bg-[#F3F4FB] border border-[#E5E7EB] outline-none rounded-xl text-on-surface appearance-none pr-8"
                  >
                    <option value="Basic">Category: Basic</option>
                    <option value="Advanced">Category: Advanced</option>
                    <option value="Medical">Category: Medical</option>
                    <option value="Conversational">Category: Chat</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
                </div>

                <button 
                  type="submit"
                  className="bg-[#3F51B5] hover:bg-[#303F9F] text-white text-xs font-extrabold px-4.5 py-2.5 rounded-xl flex items-center gap-1 shrink-0 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </form>

          {/* RECENT ADDITIONS section displaying custom additions cleanly */}
          <div className="space-y-sm pt-sm border-t border-[#F0F2FA]">
            <span className="text-[9px] font-mono font-black text-outline uppercase tracking-wider block">
              RECENT ADDITIONS
            </span>
            
            <div className="space-y-sm max-h-40 overflow-y-auto pr-1">
              
              {/* Static Item 1 (Image mockups) */}
              <div className="flex items-center justify-between p-sm bg-[#FAFAFD] rounded-xl border border-outline-variant/30">
                <div className="flex items-center gap-sm">
                  <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                    <img 
                      alt="Sign: Environment" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                      src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=150&auto=format&fit=crop" 
                    />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-extrabold text-on-surface leading-tight">Sign: Environment</h5>
                    <span className="text-[9px] text-[#7E88AC] font-semibold mt-0.5 block">Added 2h ago by Admin</span>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#E8EAF6] text-[#3F51B5] flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              {/* Static Item 2 (Image mockups) */}
              <div className="flex items-center justify-between p-sm bg-[#FAFAFD] rounded-xl border border-outline-variant/30">
                <div className="flex items-center gap-sm">
                  <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                    <img 
                      alt="Sign: Collaboration" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                      src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=150&auto=format&fit=crop" 
                    />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-extrabold text-on-surface leading-tight">Sign: Collaboration</h5>
                    <span className="text-[9px] text-[#7E88AC] font-semibold mt-0.5 block">Added 5h ago by Admin</span>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#E8EAF6] text-[#3F51B5] flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              {/* Custom dynamic additions rendering in standard view */}
              {customAdditions.map((l) => (
                <div key={l.id} className="flex items-center justify-between p-sm bg-indigo-50/40 rounded-xl border border-[#C5CAE9]/40">
                  <div className="flex items-center gap-sm truncate">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#3F51B5]/5 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-[#3F51B5]" />
                    </div>
                    <div className="truncate">
                      <h5 className="text-[11px] font-extrabold text-on-surface leading-tight truncate">{l.title}</h5>
                      <span className="text-[9px] text-[#7E88AC] font-semibold mt-0.5 block">Custom dictionary concept</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onDeleteLesson(l.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                    title="Delete custom vocabulary"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

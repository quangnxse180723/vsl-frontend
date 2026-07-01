import React, { useState } from 'react';
import { User, Vocabulary } from '../types';
import { BECategory } from '../services/api';
import { Upload, Users, Activity, BarChart, Server, Sparkles, Plus, Smile, RefreshCw, Trash2 } from 'lucide-react';

interface AdminViewProps {
  users: User[];
  vocabularyList: Vocabulary[];
  categories: BECategory[];
  onToggleUserStatus: (userId: string) => void;
  onAddVocabulary: (newVocab: { name: string; category: string; description: string; file?: File }) => void;
  onDeleteVocabulary: (vocabId: string) => void;
}

export default function AdminView({
  users,
  vocabularyList,
  categories,
  onToggleUserStatus,
  onAddVocabulary,
  onDeleteVocabulary
}: AdminViewProps) {
  // Add vocab fields
  const [vocabName, setVocabName] = useState('');
  const [vocabCategory, setVocabCategory] = useState(() => categories[0]?.name || 'Alphabet');
  const [vocabDescription, setVocabDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [notification, setNotification] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleAddVocabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vocabName.trim()) {
      alert('Vui lòng điền tên từ vựng!');
      return;
    }
    onAddVocabulary({
      name: vocabName,
      category: vocabCategory,
      description: vocabDescription || 'No description provided.',
      file: uploadedFile || undefined
    });

    setNotification(`Successfully added "${vocabName}" to active runtime libraries!`);
    setTimeout(() => setNotification(''), 4000);

    // Reset Form
    setVocabName('');
    setVocabDescription('');
    setUploadedFile(null);
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      
      {/* Intro Header */}
      <section>
        <h2 className="font-display text-3xl font-extrabold text-[#111111]">Admin Console</h2>
        <p className="text-body-md text-on-surface-variant">Monitor system telemetry, coordinate user parameters, and append real-time vocabularies.</p>
      </section>

      {/* Notifications */}
      {notification && (
        <div className="p-4 bg-green-100 text-green-800 rounded-xl font-semibold flex items-center gap-2 border border-green-200">
          <span className="material-symbols-outlined text-green-700">check_circle</span>
          {notification}
        </div>
      )}

      {/* System Telemetry stats row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active users */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 inset-shadow flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-outline">Active Users</p>
            <h3 className="text-3xl font-extrabold text-[#111111] mt-1">12.4k</h3>
            <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5 mt-1.5 bg-green-50 px-1.5 py-0.5 rounded-full w-max">
              +18% from last week
            </span>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">group</span>
          </div>
        </div>

        {/* Lessons completed */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 inset-shadow flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-outline">Lessons Completed</p>
            <h3 className="text-3xl font-extrabold text-[#111111] mt-1">84.2k</h3>
            <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5 mt-1.5 bg-green-50 px-1.5 py-0.5 rounded-full w-max">
              +24% from last week
            </span>
          </div>
          <div className="w-12 h-12 bg-[#2170e4]/10 rounded-xl flex items-center justify-center text-[#2170e4]">
            <span className="material-symbols-outlined text-2xl">done_all</span>
          </div>
        </div>

        {/* Average Match Accuracy */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 inset-shadow flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-outline">Avg Match Accuracy</p>
            <h3 className="text-3xl font-extrabold text-[#111111] mt-1">94.2%</h3>
            <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5 mt-1.5 bg-green-50 px-1.5 py-0.5 rounded-full w-max">
              +2.4% from last week
            </span>
          </div>
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600">
            <span className="material-symbols-outlined text-2xl">analytics</span>
          </div>
        </div>

        {/* System Health Status */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 inset-shadow flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-outline">System Health</p>
            <h3 className="text-3xl font-extrabold text-green-600 mt-1">Optimal</h3>
            <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5 mt-1.5 bg-green-50 px-1.5 py-0.5 rounded-full w-max">
              99.9% Core Uptime
            </span>
          </div>
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-600">
            <span className="material-symbols-outlined text-2xl">dns</span>
          </div>
        </div>
      </section>

      {/* Main Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        
        {/* Left Grid: AI Accuracy Trends (8/12 wide) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-6">
          <header className="flex justify-between items-center pb-2 border-b border-outline-variant/15">
            <div>
              <h3 className="font-display text-lg font-bold text-on-surface">AI Accuracy Trends</h3>
              <p className="text-xs text-on-surface-variant font-medium">Daily statistics of model classification reliability.</p>
            </div>
            <div className="flex items-center space-x-2 text-xs text-primary font-bold">
              <span className="w-2.5 h-2.5 bg-primary rounded-full"></span>
              <span>Model Acc v2.4</span>
            </div>
          </header>

          {/* CUSTOM SVG ACCURACY CHART (matches 1st screenshot exactly!) */}
          <div className="relative h-64 w-full bg-surface-container-low/30 rounded-xl p-4 flex flex-col justify-between">
            <svg 
              className="w-full h-full" 
              viewBox="0 0 500 200" 
              preserveAspectRatio="none"
            >
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="#dae2fd" strokeWidth="0.5" strokeDasharray="4,4" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#dae2fd" strokeWidth="0.5" strokeDasharray="4,4" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#dae2fd" strokeWidth="0.5" strokeDasharray="4,4" />
              <line x1="0" y1="160" x2="500" y2="160" stroke="#dae2fd" strokeWidth="0.5" strokeDasharray="4,4" />

              {/* Smoothed curving path coordinates */}
              {/* Mon: 90%, Tue: 88%, Wed: 94%, Thu: 92%, Fri: 96% */}
              {/* Map: x ranges 20 to 480, y values inverted (higher values mean more accuracy, i.e. lower coordinate in SVG space) */}
              <path 
                d="M 20 120 C 100 130, 130 50, 250 70 C 370 80, 420 30, 480 25" 
                fill="none" 
                stroke="#4648d4" 
                strokeWidth="4" 
                strokeLinecap="round"
              />

              {/* Shaded Area fill below curve */}
              <path 
                d="M 20 120 C 100 130, 130 50, 250 70 C 370 80, 420 30, 480 25 L 480 200 L 20 200 Z" 
                fill="url(#indigoGrad)" 
                opacity="0.15" 
              />

              {/* SVG Gradient definitions */}
              <defs>
                <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4a4be5" />
                  <stop offset="100%" stopColor="#faf8ff" />
                </linearGradient>
              </defs>

              {/* Data points nodes */}
              <circle cx="20" cy="120" r="5" fill="#4648d4" stroke="#ffffff" strokeWidth="2" />
              <circle cx="135" cy="110" r="5" fill="#4648d4" stroke="#ffffff" strokeWidth="2" />
              <circle cx="250" cy="70" r="5" fill="#4a4be5" stroke="#ffffff" strokeWidth="2" />
              <circle cx="365" cy="78" r="5" fill="#4a4be5" stroke="#ffffff" strokeWidth="2" />
              <circle cx="480" cy="25" r="5" fill="#0058be" stroke="#ffffff" strokeWidth="2" />
            </svg>

            {/* Custom overlay labels matching screenshots */}
            <div className="flex justify-between text-[10px] text-outline px-2 font-mono">
              <span>MONDAY (90%)</span>
              <span>TUESDAY (88%)</span>
              <span>WEDNESDAY (94%)</span>
              <span>THURSDAY (92%)</span>
              <span>FRIDAY (96%)</span>
            </div>
          </div>
        </div>

        {/* Right Grid: Content Management (4/12 wide) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-4">
          <header className="pb-2 border-b border-outline-variant/15">
            <h3 className="font-display text-lg font-bold text-on-surface">Content Management</h3>
            <p className="text-xs text-on-surface-variant font-medium">Quick addition of vocabulary and HD videos.</p>
          </header>

          <form onSubmit={handleAddVocabSubmit} className="space-y-4">
            
            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-outline">Library Category</label>
              <select
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium outline-none text-on-surface focus:border-primary"
                value={vocabCategory}
                onChange={(e) => setVocabCategory(e.target.value)}
              >
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))
                ) : (
                  <>
                    <option value="Alphabet">Alphabet</option>
                    <option value="Greetings">Greetings</option>
                    <option value="Numbers">Numbers</option>
                    <option value="Family">Family</option>
                    <option value="Food">Food</option>
                    <option value="Feelings">Feelings</option>
                  </>
                )}
              </select>
            </div>

            {/* Word Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-outline">Sign Word Name</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium outline-none text-on-surface focus:border-primary"
                placeholder="e.g. Letter B, Aunt"
                value={vocabName}
                onChange={(e) => setVocabName(e.target.value)}
                required
              />
            </div>

            {/* Description of sign */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-outline">Sign Description</label>
              <textarea 
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium outline-none text-on-surface focus:border-primary h-20 resize-none"
                placeholder="Provide accurate body posture instructions..."
                value={vocabDescription}
                onChange={(e) => setVocabDescription(e.target.value)}
              />
            </div>

            {/* Upload Video reference dropzone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-outline">Reference File</label>
              <div 
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                  isDragging 
                    ? 'border-primary bg-primary/5' 
                    : uploadedFile 
                      ? 'border-green-400 bg-green-50/20' 
                      : 'border-outline-variant/60 hover:border-outline'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('admin-file-picker')?.click()}
              >
                <input 
                  type="file" 
                  id="admin-file-picker" 
                  className="hidden" 
                  accept="video/*,image/*" 
                  onChange={handleFileChange}
                />
                <span className="material-symbols-outlined text-outline text-3xl mb-1.5">
                  {uploadedFile ? 'check_circle' : 'cloud_upload'}
                </span>
                <p className="text-xs text-on-surface font-semibold truncate">
                  {uploadedFile ? uploadedFile.name : 'Drag video reference or browse'}
                </p>
                <p className="text-[10px] text-outline mt-1 font-medium select-none">MP4 or WEBM, maximum 10MB</p>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs shadow hover:bg-primary/95 active-scale flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Quick Add Vocabulary
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Section: User Management (matches 1st screenshot!) */}
      <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/15">
          <div>
            <h3 className="font-display text-lg font-bold text-on-surface">User Management</h3>
            <p className="text-xs text-on-surface-variant font-medium">Verify login status, student proficiency scales, and toggle active states.</p>
          </div>
          <span className="text-xs font-bold text-outline uppercase tracking-wider">{users.length} enrolled student models</span>
        </header>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 text-outline text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 font-bold select-none">Name / Profile</th>
                <th className="py-3 px-4 font-bold select-none">Email Address</th>
                <th className="py-3 px-4 font-bold select-none">Status Badge</th>
                <th className="py-3 px-4 font-bold select-none">Proficiency Rate</th>
                <th className="py-3 px-4 font-bold select-none">Last Active</th>
                <th className="py-3 px-4 text-center font-bold select-none">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-outline-variant/15 hover:bg-surface-container-low/25 transition-colors">
                  {/* Name */}
                  <td className="py-4 px-4 flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-surface-variant overflow-hidden border border-outline-variant/60">
                      <img className="w-full h-full object-cover" src={u.avatar} alt={u.name} />
                    </div>
                    <span className="font-label-bold text-[#111111]">{u.name}</span>
                  </td>
                  
                  {/* Email */}
                  <td className="py-4 px-4 font-medium text-on-surface-variant">{u.email}</td>
                  
                  {/* Status Badge */}
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold leading-none ${
                      u.status === 'Active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  
                  {/* Proficiency */}
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-surface-container-high rounded-full overflow-hidden shrink-0">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${u.proficiency}%` }}></div>
                      </div>
                      <span className="font-mono text-xs font-bold text-on-surface">{u.proficiency}%</span>
                    </div>
                  </td>
                  
                  {/* Last active */}
                  <td className="py-4 px-4 text-outline font-medium">{u.lastActive}</td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-center">
                    <button 
                      onClick={() => onToggleUserStatus(u.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 ${
                        u.status === 'Active' 
                          ? 'bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/15'
                          : 'bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/15'
                      }`}
                    >
                      {u.status === 'Active' ? 'Set Idle' : 'Set Active'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Vocabulary List Editor (Manage catalog words) */}
      <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-4">
        <header className="pb-2 border-b border-outline-variant/15">
          <h3 className="font-display text-lg font-bold text-on-surface">Registered Vocabulary Library list</h3>
          <p className="text-xs text-on-surface-variant">Review words integrated inside active calibration templates.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vocabularyList.map(v => (
            <div 
              key={v.id} 
              className="p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant/30 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-10 h-10 bg-surface-variant rounded-lg shrink-0 overflow-hidden border border-outline-variant/45">
                  <img className="w-full h-full object-cover" src={v.image} alt={v.name} />
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-label-bold text-xs truncate text-[#111111]">{v.name}</h4>
                  <p className="text-[10px] text-outline truncate">{v.category}</p>
                </div>
              </div>
              <button 
                onClick={() => onDeleteVocabulary(v.id)}
                className="p-2 hover:bg-[#ba1a1a]/10 text-outline hover:text-[#ba1a1a] rounded-lg transition-colors flex items-center justify-center shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

import React, { useState } from 'react';
import { User, Achievement } from '../types';
import { Award, Shield, Bell, Eye, Volume2, LogOut, Save, Camera, Check } from 'lucide-react';

interface ProfileViewProps {
  currentUser: User;
  achievements: Achievement[];
  onLogout: () => void;
}

export default function ProfileView({ currentUser, achievements, onLogout }: ProfileViewProps) {
  // Settings Toggles
  const [emailNotify, setEmailNotify] = useState(true);
  const [hudMesh, setHudMesh] = useState(true);
  const [voiceCoach, setVoiceCoach] = useState(false);
  const [userProfileName, setUserProfileName] = useState(currentUser.name);

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      <header>
        <h2 className="font-display text-3xl font-extrabold text-[#111111]">Student Profile</h2>
        <p className="text-body-md text-on-surface-variant">Configure details, manage preferences, and view earned certifications.</p>
      </header>

      {saveSuccess && (
        <div className="p-4 bg-green-100 text-green-800 rounded-xl font-semibold flex items-center gap-2 border border-green-200 shadow-sm">
          <span className="material-symbols-outlined text-green-700">check_circle</span>
          Profile settings saved successfully!
        </div>
      )}

      {/* Hero section */}
      <section className="p-6 md:p-8 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-6 elevation-1">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 shrink-0 shadow-md">
            <img className="w-full h-full object-cover" src={currentUser.avatar} alt={currentUser.name} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-bold text-[#111111]">{userProfileName}</h3>
            <p className="text-sm font-semibold text-primary">Level 2 Apprentice • ASL Practitioner</p>
            <p className="text-xs text-outline">{currentUser.email}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            type="button" 
            onClick={onLogout}
            className="px-5 py-2.5 bg-red-50 text-[#ba1a1a] border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100/60 transition-colors flex items-center gap-1.5 active-scale shrink-0"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </section>

      {/* Main Grid: Info Preferences & Badges cabinet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        
        {/* Left Side: Cabinets & Settings (7/12 wide) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-5">
            <div className="flex items-center space-x-2 border-b border-outline-variant/15 pb-2">
              <span className="material-symbols-outlined text-primary">settings</span>
              <h3 className="font-display text-lg font-bold">Preferences</h3>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* Profile details */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-outline">Display Name</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/60 rounded-lg text-sm text-on-surface font-medium outline-none focus:border-primary"
                  value={userProfileName}
                  onChange={(e) => setUserProfileName(e.target.value)}
                />
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-2">
                {/* Notification */}
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-outline mt-0.5">notifications</span>
                    <div>
                      <p className="text-xs font-bold text-[#111111]">Daily practice reminders</p>
                      <p className="text-[10px] text-outline">Receive email alerts on streak renewal.</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setEmailNotify(!emailNotify)}
                    className={`w-10 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${emailNotify ? 'bg-primary' : 'bg-surface-container-high'}`}
                  >
                    <span className={`w-4 safety-box h-4 rounded-full bg-white transition-all absolute ${emailNotify ? 'left-5' : 'left-1'}`}></span>
                  </button>
                </div>

                {/* HUD Camera Guides */}
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-outline mt-0.5">grid_on</span>
                    <div>
                      <p className="text-xs font-bold text-[#111111]">HUD Tracking Mesh Lines</p>
                      <p className="text-[10px] text-outline">Draw neural nodes over Live Feed preview canvas.</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setHudMesh(!hudMesh)}
                    className={`w-10 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${hudMesh ? 'bg-primary' : 'bg-surface-container-high'}`}
                  >
                    <span className={`w-4 safety-box h-4 rounded-full bg-white transition-all absolute ${hudMesh ? 'left-5' : 'left-1'}`}></span>
                  </button>
                </div>

                {/* Real-time Voice Coach */}
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-outline mt-0.5">volume_up</span>
                    <div>
                      <p className="text-xs font-bold text-[#111111]">Voice guidelines assistant</p>
                      <p className="text-[10px] text-outline">Hear automated audio confirmations when signs are mastered.</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setVoiceCoach(!voiceCoach)}
                    className={`w-10 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${voiceCoach ? 'bg-primary' : 'bg-surface-container-high'}`}
                  >
                    <span className={`w-4 safety-box h-4 rounded-full bg-white transition-all absolute ${voiceCoach ? 'left-5' : 'left-1'}`}></span>
                  </button>
                </div>
              </div>

              {/* Save Settings Button */}
              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary/95 text-on-primary rounded-xl font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5 active-scale"
              >
                <Save className="w-4 h-4" />
                Save Preferences
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Badges Grid (5/12 wide) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-4">
            <div className="flex items-center space-x-2 border-b border-outline-variant/15 pb-2">
              <span className="material-symbols-outlined text-primary">emoji_events</span>
              <h3 className="font-display text-lg font-bold">Achievements Cabinet</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {achievements.map(ach => (
                <div 
                  key={ach.id} 
                  className={`p-4 rounded-xl border flex flex-col items-center text-center space-y-2.5 transition-all ${
                    ach.secured 
                      ? 'bg-surface-container-low/40 border-outline-variant/30 hover:border-primary' 
                      : 'bg-surface-container-low/10 border-outline-variant/10 opacity-60'
                  }`}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${ach.color} rounded-full flex items-center justify-center text-white shadow-sm`}>
                    <span className="material-symbols-outlined text-2xl font-bold">
                      {ach.icon}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-label-bold text-xs text-[#111111]">{ach.title}</h4>
                    <p className="text-[10px] text-outline mt-0.5">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

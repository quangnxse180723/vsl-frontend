
import React, { useEffect, useState } from 'react';
import { User, Achievement } from '../types';
import { userApi } from '../services/api/userApi';
import { Award, Shield, Bell, Eye, Volume2, LogOut, Save, Camera, Check } from 'lucide-react';

interface ProfileViewProps {
  currentUser: User;
  achievements: Achievement[];
  onLogout: () => void;
  onUpdateUser: (updated: User) => void;
}

export default function ProfileView({ currentUser, achievements, onLogout, onUpdateUser }: ProfileViewProps) {
  // Settings Toggles (local-only preferences, no backend endpoint exists for these yet)
  const [emailNotify, setEmailNotify] = useState(true);
  const [hudMesh, setHudMesh] = useState(true);
  const [voiceCoach, setVoiceCoach] = useState(false);

  // Profile identity fields, backed by GET/PUT /api/users/me
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(currentUser.email);
  const [fullName, setFullName] = useState(currentUser.name);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change fields, backed by PUT /api/users/password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [saveSuccess, setSaveSuccess] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    userApi.getProfile().then(profile => {
      setUsername(profile.username);
      setEmail(profile.email);
      setFullName(profile.fullName);
      setProfileLoaded(true);
    }).catch(() => {
      setErrorMessage('Could not load profile details from the server.');
    });
  }, []);

  const flashSuccess = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const flashError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 4000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await userApi.updateProfile({ username, email, fullName });
      onUpdateUser({ ...currentUser, name: updated.fullName, email: updated.email });
      flashSuccess('Profile settings saved successfully!');
    } catch (error) {
      flashError('Failed to update profile. Please check your details.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      flashError('Please fill in both password fields.');
      return;
    }
    setChangingPassword(true);
    try {
      await userApi.updatePassword({ oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      flashSuccess('Password changed successfully!');
    } catch (error) {
      flashError('Failed to change password. Check your current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploadedUrl = await userApi.uploadAvatar(file);
      const updated = await userApi.updateAvatarUrl(uploadedUrl);
      onUpdateUser({ ...currentUser, avatar: updated.avatarUrl || currentUser.avatar });
      flashSuccess('Avatar updated successfully!');
    } catch (error) {
      flashError('Failed to upload avatar.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) {
      return;
    }
    try {
      await userApi.deleteAccount();
      onLogout();
    } catch (error) {
      flashError('Failed to delete account.');
    }
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
          {saveSuccess}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-100 text-[#ba1a1a] rounded-xl font-semibold flex items-center gap-2 border border-red-200 shadow-sm">
          <span className="material-symbols-outlined">error</span>
          {errorMessage}
        </div>
      )}

      {/* Hero section */}
      <section className="p-6 md:p-8 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-6 elevation-1">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 shrink-0 shadow-md group">
            <img className="w-full h-full object-cover" src={currentUser.avatar} alt={currentUser.name} />
            <label
              htmlFor="avatar-upload-input"
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              title="Change avatar"
            >
              <Camera className="w-6 h-6 text-white" />
            </label>
            <input id="avatar-upload-input" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-bold text-[#111111]">{currentUser.name}</h3>
            <p className="text-sm font-semibold text-primary">Level 2 Apprentice • VSL Practitioner</p>
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
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!profileLoaded}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-outline">Username</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/60 rounded-lg text-sm text-on-surface font-medium outline-none focus:border-primary"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!profileLoaded}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-outline">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/60 rounded-lg text-sm text-on-surface font-medium outline-none focus:border-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!profileLoaded}
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
                disabled={savingProfile || !profileLoaded}
                className="w-full py-2.5 bg-primary hover:bg-primary/95 text-on-primary rounded-xl font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5 active-scale disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          </div>

          {/* Password & Account Danger Zone */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-5">
            <div className="flex items-center space-x-2 border-b border-outline-variant/15 pb-2">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-display text-lg font-bold">Security</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-outline">Current Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/60 rounded-lg text-sm text-on-surface font-medium outline-none focus:border-primary"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-outline">New Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/60 rounded-lg text-sm text-on-surface font-medium outline-none focus:border-primary"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={changingPassword}
                className="w-full py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5 active-scale disabled:opacity-60"
              >
                {changingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </form>

            <div className="pt-4 border-t border-outline-variant/15">
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="w-full py-2.5 bg-red-50 text-[#ba1a1a] border border-red-200 rounded-xl font-bold text-xs hover:bg-red-100/60 transition-colors active-scale"
              >
                Delete Account
              </button>
            </div>
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


import React, { useEffect, useState } from 'react';
import { User, Achievement } from '../types';
import { userApi } from '../services/api/userApi';
import { Shield, LogOut, Save, Camera, ChevronDown } from 'lucide-react';
import { validateFullName, validateUsername, validateEmail, validatePassword, validateRequired, isFormValid } from '../utils/validation';

interface ProfileViewProps {
  currentUser: User;
  achievements: Achievement[];
  onLogout: () => void;
  onUpdateUser: (updated: User) => void;
}

export default function ProfileView({ currentUser, achievements, onLogout, onUpdateUser }: ProfileViewProps) {
  // Settings Toggles (local-only preferences, no backend endpoint exists for these yet)
  const [emailNotify, setEmailNotify] = useState(true);

  // Profile identity fields, backed by GET/PUT /api/users/me
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(currentUser.email);
  const [fullName, setFullName] = useState(currentUser.name);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change fields, backed by PUT /api/users/password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [saveSuccess, setSaveSuccess] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Loi validate theo tung truong
  const [profileErrors, setProfileErrors] = useState<{ fullName: string; username: string; email: string }>({ fullName: '', username: '', email: '' });
  const [passwordErrors, setPasswordErrors] = useState<{ oldPassword: string; newPassword: string }>({ oldPassword: '', newPassword: '' });

  useEffect(() => {
    userApi.getProfile().then(profile => {
      setUsername(profile.username);
      setEmail(profile.email);
      setFullName(profile.fullName);
      setProfileLoaded(true);
    }).catch(() => {
      setErrorMessage('Không thể tải thông tin hồ sơ từ máy chủ.');
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
    const fieldErrors = {
      fullName: validateFullName(fullName),
      username: validateUsername(username),
      email: validateEmail(email),
    };
    setProfileErrors(fieldErrors);
    if (!isFormValid(fieldErrors)) return;
    setSavingProfile(true);
    try {
      const updated = await userApi.updateProfile({ username, email, fullName });
      onUpdateUser({ ...currentUser, name: updated.fullName, email: updated.email });
      flashSuccess('Đã lưu thông tin hồ sơ thành công!');
    } catch (error) {
      flashError('Không thể cập nhật hồ sơ. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldErrors = {
      oldPassword: validateRequired(oldPassword, 'Mật khẩu hiện tại'),
      newPassword: validatePassword(newPassword),
    };
    setPasswordErrors(fieldErrors);
    if (!isFormValid(fieldErrors)) return;
    setChangingPassword(true);
    try {
      await userApi.updatePassword({ oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setShowPasswordForm(false);
      flashSuccess('Đổi mật khẩu thành công!');
    } catch (error) {
      flashError('Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.');
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
      flashSuccess('Cập nhật ảnh đại diện thành công!');
    } catch (error) {
      flashError('Không thể tải lên ảnh đại diện.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa vĩnh viễn tài khoản này? Hành động này không thể hoàn tác.')) {
      return;
    }
    try {
      await userApi.deleteAccount();
      onLogout();
    } catch (error) {
      flashError('Không thể xóa tài khoản.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      <header>
        <h2 className="font-display text-3xl font-extrabold text-gradient-brand">Hồ Sơ Học Viên</h2>
        <p className="text-body-md text-on-surface-variant">Cập nhật thông tin, quản lý tùy chọn và xem thành tích đã đạt được.</p>
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
              title="Đổi ảnh đại diện"
            >
              <Camera className="w-6 h-6 text-white" />
            </label>
            <input id="avatar-upload-input" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-bold text-gradient-brand">{currentUser.name}</h3>
            <p className="text-sm font-semibold text-primary">Học Viên Cấp 2 • Người Học VSL</p>
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
            Đăng Xuất
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
              <h3 className="font-display text-lg font-bold text-gradient-brand">Tùy Chọn</h3>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* Profile details */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-outline">Họ và Tên</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 bg-surface-container-low border rounded-lg text-sm text-on-surface font-medium outline-none focus:border-primary ${profileErrors.fullName ? 'border-red-400' : 'border-outline-variant/60'}`}
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setProfileErrors(p => ({ ...p, fullName: '' })); }}
                  disabled={!profileLoaded}
                />
                {profileErrors.fullName && <p className="text-[11px] text-red-600">{profileErrors.fullName}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-outline">Tên Hiển Thị</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 bg-surface-container-low border rounded-lg text-sm text-on-surface font-medium outline-none focus:border-primary ${profileErrors.username ? 'border-red-400' : 'border-outline-variant/60'}`}
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setProfileErrors(p => ({ ...p, username: '' })); }}
                  disabled={!profileLoaded}
                />
                {profileErrors.username && <p className="text-[11px] text-red-600">{profileErrors.username}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-outline">Email</label>
                <input
                  type="email"
                  className={`w-full px-3 py-2 bg-surface-container-low border rounded-lg text-sm text-on-surface font-medium outline-none focus:border-primary ${profileErrors.email ? 'border-red-400' : 'border-outline-variant/60'}`}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setProfileErrors(p => ({ ...p, email: '' })); }}
                  disabled={!profileLoaded}
                />
                {profileErrors.email && <p className="text-[11px] text-red-600">{profileErrors.email}</p>}
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-2">
                {/* Notification */}
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-outline mt-0.5">notifications</span>
                    <div>
                      <p className="text-xs font-bold text-[#111111]">Nhắc nhở luyện tập hàng ngày</p>
                      <p className="text-[10px] text-outline">Nhận email nhắc nhở khi chuỗi ngày học được gia hạn.</p>
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

              </div>

              {/* Save Settings Button */}
              <button
                type="submit"
                disabled={savingProfile || !profileLoaded}
                className="w-full py-2.5 bg-primary hover:bg-primary/95 text-on-primary rounded-xl font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5 active-scale disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? 'Đang lưu...' : 'Lưu Tùy Chọn'}
              </button>
            </form>
          </div>

          {/* Password & Account Danger Zone */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-5">
            <div className="flex items-center space-x-2 border-b border-outline-variant/15 pb-2">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-display text-lg font-bold text-gradient-brand">Bảo Mật</h3>
            </div>

            <button
              type="button"
              onClick={() => setShowPasswordForm(prev => !prev)}
              className="w-full flex items-center justify-between py-1"
            >
              <span className="text-sm font-bold text-on-surface">Đổi Mật Khẩu</span>
              <ChevronDown className={`w-4 h-4 text-outline transition-transform ${showPasswordForm ? 'rotate-180' : ''}`} />
            </button>

            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-outline">Mật Khẩu Hiện Tại</label>
                  <input
                    type="password"
                    className={`w-full px-3 py-2 bg-surface-container-low border rounded-lg text-sm text-on-surface font-medium outline-none focus:border-primary ${passwordErrors.oldPassword ? 'border-red-400' : 'border-outline-variant/60'}`}
                    value={oldPassword}
                    onChange={(e) => { setOldPassword(e.target.value); setPasswordErrors(p => ({ ...p, oldPassword: '' })); }}
                  />
                  {passwordErrors.oldPassword && <p className="text-[11px] text-red-600">{passwordErrors.oldPassword}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-outline">Mật Khẩu Mới</label>
                  <input
                    type="password"
                    className={`w-full px-3 py-2 bg-surface-container-low border rounded-lg text-sm text-on-surface font-medium outline-none focus:border-primary ${passwordErrors.newPassword ? 'border-red-400' : 'border-outline-variant/60'}`}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordErrors(p => ({ ...p, newPassword: '' })); }}
                  />
                  {passwordErrors.newPassword
                    ? <p className="text-[11px] text-red-600">{passwordErrors.newPassword}</p>
                    : <p className="text-[10px] text-outline">Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số.</p>}
                </div>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5 active-scale disabled:opacity-60"
                >
                  {changingPassword ? 'Đang cập nhật...' : 'Lưu Mật Khẩu Mới'}
                </button>
              </form>
            )}

            <div className="pt-4 border-t border-outline-variant/15">
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="w-full py-2.5 bg-red-50 text-[#ba1a1a] border border-red-200 rounded-xl font-bold text-xs hover:bg-red-100/60 transition-colors active-scale"
              >
                Xóa Tài Khoản
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Badges Grid (5/12 wide) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-4">
            <div className="flex items-center space-x-2 border-b border-outline-variant/15 pb-2">
              <span className="material-symbols-outlined text-primary">emoji_events</span>
              <h3 className="font-display text-lg font-bold text-gradient-brand">Tủ Thành Tích</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {achievements.map(ach => (
                <div
                  key={ach.id}
                  className={`p-4 rounded-xl border flex flex-col items-center text-center space-y-2.5 transition-all ${
                    ach.secured
                      ? 'bg-surface-container-low/40 border-outline-variant/30 hover:border-primary'
                      : 'bg-surface-container-low/10 border-outline-variant/10'
                  }`}
                >
                  <div
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${
                      ach.secured ? `bg-gradient-to-br ${ach.color} text-white` : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl font-bold">
                      {ach.icon}
                    </span>
                    {!ach.secured && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-500 border-2 border-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-[11px] text-white leading-none">lock</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full">
                    <h4 className={`font-label-bold text-xs ${ach.secured ? 'text-[#111111]' : 'text-outline'}`}>{ach.title}</h4>
                    <p className="text-[10px] text-outline mt-0.5">{ach.description}</p>
                    {!ach.secured && ach.progressTarget !== undefined && (
                      <div className="mt-2 space-y-1">
                        <div className="w-full h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/60 rounded-full"
                            style={{ width: `${Math.min((ach.progressCurrent! / ach.progressTarget) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-bold text-primary">
                          {ach.progressCurrent}/{ach.progressTarget} {ach.progressUnit}
                        </p>
                      </div>
                    )}
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

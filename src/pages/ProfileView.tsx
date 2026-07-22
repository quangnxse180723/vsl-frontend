import React, { useEffect, useState } from 'react';
import { User, Achievement } from '../types';
import { userApi } from '../services/api/userApi';
import { Shield, LogOut, Save, Camera, ChevronDown, Bell, BellOff, Mail, Clock, Flame } from 'lucide-react';
import { validateFullName, validateUsername, validateEmail, validatePassword, validateRequired, isFormValid } from '../utils/validation';

interface ProfileViewProps {
  currentUser: User;
  achievements: Achievement[];
  onLogout: () => void;
  onUpdateUser: (updated: User) => void;
}

export default function ProfileView({ currentUser, achievements, onLogout, onUpdateUser }: ProfileViewProps) {
  // Settings Toggles - backed by PATCH /api/users/me/notifications
  const [emailNotify, setEmailNotify] = useState(false);
  const [savingNotify, setSavingNotify] = useState(false);

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
      setEmailNotify(profile.emailNotificationsEnabled ?? false);
      setProfileLoaded(true);
    }).catch(() => {
      setErrorMessage('Không thể tải thông tin hồ sơ từ máy chủ.');
    });
  }, []);

  const handleToggleNotification = async (value: boolean) => {
    if (savingNotify) return;
    setSavingNotify(true);
    try {
      await userApi.updateNotificationSettings(value);
      setEmailNotify(value);
      flashSuccess(value ? '🔔 Đã bật nhắc nhở học tập!' : '🔕 Đã tắt nhắc nhở học tập!');
    } catch {
      flashError('Không thể cập nhật cài đặt. Vui lòng thử lại.');
    } finally {
      setSavingNotify(false);
    }
  };

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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">

        {/* Left Side (7/12) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Profile Form */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-5">
            <div className="flex items-center space-x-2 border-b border-outline-variant/15 pb-2">
              <span className="material-symbols-outlined text-primary">person</span>
              <h3 className="font-display text-lg font-bold text-gradient-brand">Thông Tin Cá Nhân</h3>
            </div>
            <form onSubmit={handleSaveSettings} className="space-y-5">
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
              <button
                type="submit"
                disabled={savingProfile || !profileLoaded}
                className="w-full py-2.5 bg-primary hover:bg-primary/95 text-on-primary rounded-xl font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5 active-scale disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? 'Đang lưu...' : 'Lưu Thông Tin'}
              </button>
            </form>
          </div>

          {/* ── Email Notification Card ── */}
          <div className="rounded-2xl border border-outline-variant/30 elevation-1 overflow-hidden bg-surface-container-lowest">
            {/* Header */}
            <div className="px-6 py-4 border-b border-outline-variant/15 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="font-display text-lg font-bold text-gradient-brand">Thông Báo Email</h3>
            </div>

            {/* Main toggle row */}
            <div className="px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${emailNotify ? 'bg-primary/10' : 'bg-surface-container-high'}`}>
                    {emailNotify
                      ? <Bell className="w-5 h-5 text-primary" />
                      : <BellOff className="w-5 h-5 text-outline" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-on-surface">Nhắc nhở chuỗi học tập</p>
                    <p className="text-[11px] text-outline mt-0.5 leading-relaxed">
                      Gửi email khi bạn sắp mất chuỗi ngày học liên tiếp.
                    </p>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={() => handleToggleNotification(!emailNotify)}
                  disabled={savingNotify || !profileLoaded}
                  aria-pressed={emailNotify}
                  aria-label={emailNotify ? 'Tắt thông báo email' : 'Bật thông báo email'}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${emailNotify ? 'bg-primary' : 'bg-surface-container-high'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${emailNotify ? 'left-7' : 'left-1'}`} />
                  {savingNotify && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-3 h-3 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                    </span>
                  )}
                </button>
              </div>

              {/* Status pill */}
              <div className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-300 ${
                emailNotify ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-surface-container-high text-outline border border-outline-variant/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full transition-colors ${emailNotify ? 'bg-green-500' : 'bg-outline'}`} />
                {emailNotify ? 'Đang hoạt động' : 'Đã tắt'}
              </div>
            </div>

            {/* When ENABLED: show details + email preview */}
            {emailNotify && (
              <div className="px-6 pb-6 space-y-4 border-t border-outline-variant/10">
                {/* Info grid */}
                <div className="grid grid-cols-3 gap-3 pt-4">
                  <div className="flex flex-col gap-1.5 p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 text-center">
                    <Clock className="w-4 h-4 text-primary mx-auto" />
                    <p className="text-[10px] text-outline uppercase tracking-wide font-bold">Giờ gửi</p>
                    <p className="text-xs font-extrabold text-on-surface">Sau khi học</p>
                  </div>
                  <div className="flex flex-col gap-1.5 p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 text-center">
                    <Flame className="w-4 h-4 text-orange-500 mx-auto" />
                    <p className="text-[10px] text-outline uppercase tracking-wide font-bold">Điều kiện</p>
                    <p className="text-xs font-extrabold text-on-surface">Vừa hoàn thành</p>
                  </div>
                  <div className="flex flex-col gap-1.5 p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 text-center">
                    <Mail className="w-4 h-4 text-blue-500 mx-auto" />
                    <p className="text-[10px] text-outline uppercase tracking-wide font-bold">Tần suất</p>
                    <p className="text-xs font-extrabold text-on-surface">1 lần / ngày</p>
                  </div>
                </div>


              </div>
            )}

            {/* When DISABLED: show info hint */}
            {!emailNotify && profileLoaded && (
              <div className="px-6 pb-5">
                <div className="flex items-start gap-2.5 p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/20">
                  <BellOff className="w-4 h-4 text-outline shrink-0 mt-0.5" />
                  <p className="text-[11px] text-outline leading-relaxed">
                    Bật thông báo để nhận email nhắc nhở lúc <strong className="text-on-surface">19h giờ VN</strong> khi bạn sắp mất chuỗi ngày học. Hệ thống chỉ gửi <strong className="text-on-surface">1 lần / ngày</strong> và chỉ khi bạn có streak &gt; 0.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Password & Danger Zone */}
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

        {/* Right Side: Achievements (5/12) */}
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
                  <div className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${ach.secured ? `bg-gradient-to-br ${ach.color} text-white` : 'bg-slate-200 text-slate-400'}`}>
                    <span className="material-symbols-outlined text-2xl font-bold">{ach.icon}</span>
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
                          <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.min((ach.progressCurrent! / ach.progressTarget) * 100, 100)}%` }} />
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

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowLeft, Sparkles, UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import { validateFullName, validateUsername, validateEmail, validatePassword, isFormValid } from '../utils/validation';
import { getApiErrorMessage } from '../services/api/apiError';
import { authApi } from '../services/api/authApi';

interface RegisterViewProps {
  onRegister: (name: string, username: string, email: string, password: string, otp: string) => Promise<void>;
  onSwitchToLogin: () => void;
  onBack?: () => void;
}

const stardustParticles = Array.from({ length: 25 }).map((_, i) => ({
  id: i,
  size: Math.random() * 3 + 1,
  left: Math.random() * 100,
  duration: Math.random() * 15 + 10,
  delay: Math.random() * 10,
}));

export default function RegisterView({ onRegister, onSwitchToLogin, onBack }: RegisterViewProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name: string; username: string; email: string; password: string }>({ name: '', username: '', email: '', password: '' });

  const clearError = (field: keyof typeof errors) => setErrors(p => ({ ...p, [field]: '' }));

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const fieldErrors = {
      name: validateFullName(name),
      username: validateUsername(username),
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(fieldErrors);
    if (!isFormValid(fieldErrors)) return;

    setErrorMessage('');
    setSubmitting(true);
    try {
      await authApi.sendRegisterOtp(email, username);
      setStep(2);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, 'Lỗi hệ thống. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (otp.length !== 6) {
      setErrorMessage('Mã OTP phải gồm 6 chữ số');
      return;
    }

    setErrorMessage('');
    setSubmitting(true);
    try {
      await onRegister(name, username, email, password, otp);
      // App se auto switch sang login neu thanh cong
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, 'Đăng ký thất bại. Vui lòng kiểm tra lại mã OTP.'));
    } finally {
      setSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="relative h-screen w-screen bg-[#020205] flex items-center justify-center p-4 overflow-hidden selection:bg-indigo-500/30 text-white">
      
      {/* HIỆU ỨNG 1: Bụi sao bay lơ lửng */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stardustParticles.map(p => (
          <motion.div
            key={p.id}
            initial={{ y: '110vh', opacity: 0, x: `${p.left}vw` }}
            animate={{ y: '-10vh', opacity: [0, 0.8, 0] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
            className="absolute bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"
            style={{ width: p.size, height: p.size }}
          />
        ))}
      </div>

      {/* HIỆU ỨNG 2: Tinh vân cực quang (Aurora Background) */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-10%] w-[55vw] h-[55vw] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, rgba(79,70,229,0) 70%)' }}
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-20%] left-[-10%] w-[65vw] h-[65vw] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0) 70%)' }}
      />

      {/* Container chính */}
      <div className="relative z-10 w-full max-w-[900px] max-h-[95vh] flex flex-col md:flex-row-reverse rounded-[2rem] overflow-hidden border border-white/20 shadow-2xl bg-white/[0.02] backdrop-blur-lg">
        
        {/* Right Column: Artwork (Đã bỏ hiệu ứng thụt ra thụt vô, khôi phục lại cố định) */}
        <div className="hidden md:flex md:w-1/2 p-8 flex-col justify-center relative z-10 border-l border-white/10">
          <div className="absolute inset-0 bg-gradient-to-bl from-indigo-500/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 w-full">
            <div className="flex items-center gap-2 mb-8">
              <button
                onClick={onBack}
                className="flex items-center gap-2 group bg-transparent border-none p-0"
                style={{ cursor: onBack ? 'pointer' : 'default' }}
              >
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner backdrop-blur-md group-hover:bg-white/20 transition-colors">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <motion.span 
                  animate={{ opacity: [0.7, 1, 0.7], textShadow: ["0px 0px 2px rgba(255,255,255,0.1)", "0px 0px 12px rgba(255,255,255,0.9)", "0px 0px 2px rgba(255,255,255,0.1)"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="font-display text-xl font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors"
                >
                  SignMentor
                </motion.span>
              </button>
            </div>

            <h1 className="font-display text-4xl lg:text-5xl font-extrabold leading-[1.1] mb-4">
              Gia nhập <br />
              <motion.span 
                animate={{ backgroundPosition: ["-200% center", "200% center"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: "200% auto" }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-indigo-400 inline-block"
              >
                Kỷ nguyên AI
              </motion.span>
            </h1>
            <p className="text-sm text-white/70 max-w-[250px]">
              Tạo hồ sơ để mở khóa công nghệ theo dõi cử chỉ bằng AI và lộ trình học ngôn ngữ ký hiệu dành riêng cho bạn.
            </p>
          </div>
        </div>

        {/* Left Column: Glass Form */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center relative z-20 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-sm w-full mx-auto my-auto relative z-30">
            
            <motion.div variants={itemVariants} className="mb-6">
              <button 
                type="button"
                onClick={onSwitchToLogin}
                className="flex items-center gap-1.5 text-white/60 hover:text-white mb-4 transition-colors text-xs font-bold group/back"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover/back:-translate-x-1 transition-transform" />
                Quay lại Đăng nhập
              </button>
              <h2 className="font-display text-2xl font-bold mb-1">Khởi Tạo Hồ Sơ</h2>
              <p className="text-white/60 text-xs">
                {step === 1 ? 'Đăng ký thông tin để hệ thống thiết lập không gian học tập cho bạn.' : 'Nhập mã OTP 6 số vừa được gửi đến email của bạn.'}
              </p>
            </motion.div>

            {errorMessage && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-base">warning</span> {errorMessage}
              </motion.div>
            )}

            {step === 1 ? (
              <form onSubmit={handleStep1} className="space-y-4 relative z-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={itemVariants} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Họ và Tên</label>
                    <div className="relative group/input">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-white transition-colors" />
                      <input
                        type="text" value={name} onChange={(e) => { setName(e.target.value); clearError('name'); setErrorMessage(''); }}
                        className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl outline-none focus:bg-white/20 transition-all text-white placeholder:text-white/40 text-sm shadow-inner ${errors.name ? 'border-red-500/60 focus:border-red-400' : 'border-white/20 focus:border-indigo-400'}`}
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                    {errors.name && <p className="text-[11px] text-red-400 ml-1">{errors.name}</p>}
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Tên Hiển Thị</label>
                    <div className="relative group/input">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-white transition-colors" />
                      <input
                        type="text" value={username} onChange={(e) => { setUsername(e.target.value); clearError('username'); setErrorMessage(''); }}
                        className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl outline-none focus:bg-white/20 transition-all text-white placeholder:text-white/40 text-sm shadow-inner ${errors.username ? 'border-red-500/60 focus:border-red-400' : 'border-white/20 focus:border-indigo-400'}`}
                        placeholder="nguyenvana"
                      />
                    </div>
                    {errors.username && <p className="text-[11px] text-red-400 ml-1">{errors.username}</p>}
                  </motion.div>
                </div>

                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Địa Chỉ Email</label>
                  <div className="relative group/input">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-white transition-colors" />
                    <input
                      type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearError('email'); setErrorMessage(''); }}
                      className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl outline-none focus:bg-white/20 transition-all text-white placeholder:text-white/40 text-sm shadow-inner ${errors.email ? 'border-red-500/60 focus:border-red-400' : 'border-white/20 focus:border-indigo-400'}`}
                      placeholder="nguoidung@email.com"
                    />
                  </div>
                  {errors.email && <p className="text-[11px] text-red-400 ml-1">{errors.email}</p>}
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Mật Khẩu</label>
                  <div className="relative group/input">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-white transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); clearError('password'); setErrorMessage(''); }}
                      className={`w-full pl-10 pr-11 py-3 bg-white/10 border rounded-xl outline-none focus:bg-white/20 transition-all text-white placeholder:text-white/40 text-sm shadow-inner ${errors.password ? 'border-red-500/60 focus:border-red-400' : 'border-white/20 focus:border-indigo-400'}`}
                      placeholder="8-12 ký tự, có hoa, thường, số"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[11px] text-red-400 ml-1">{errors.password}</p>}
                </motion.div>

                <motion.div variants={itemVariants} className="pt-2">
                  <motion.button
                    whileHover={submitting ? undefined : { scale: 1.02 }}
                    whileTap={submitting ? undefined : { scale: 0.98 }}
                    type="submit"
                    disabled={submitting}
                    className="w-full relative group/btn overflow-hidden bg-indigo-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-indigo-500 hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10">{submitting ? 'Đang gửi mã...' : 'Tiếp Theo'}</span>
                    {submitting
                      ? <Loader2 className="w-4 h-4 relative z-10 animate-spin" />
                      : <UserPlus className="w-4 h-4 relative z-10" />}
                  </motion.button>
                </motion.div>
              </form>
            ) : (
              <form onSubmit={handleStep2} className="space-y-4 relative z-20">
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Mã OTP</label>
                  <input
                    type="text" 
                    value={otp} 
                    onChange={(e) => { setOtp(e.target.value); setErrorMessage(''); }}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl outline-none focus:bg-white/20 focus:border-indigo-400 transition-all text-white placeholder:text-white/40 text-center text-xl font-mono shadow-inner tracking-[0.5em]"
                    placeholder="------"
                    maxLength={6}
                  />
                </motion.div>
                
                <motion.div variants={itemVariants} className="pt-2">
                  <motion.button
                    whileHover={submitting ? undefined : { scale: 1.02 }}
                    whileTap={submitting ? undefined : { scale: 0.98 }}
                    type="submit"
                    disabled={submitting || otp.length < 6}
                    className="w-full relative group/btn overflow-hidden bg-indigo-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-indigo-500 hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10">{submitting ? 'Đang xác thực...' : 'Xác Nhận Đăng Ký'}</span>
                    {submitting && <Loader2 className="w-4 h-4 relative z-10 animate-spin" />}
                  </motion.button>
                  <div className="mt-4 text-center">
                    <button type="button" onClick={() => setStep(1)} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                      Quay lại sửa thông tin
                    </button>
                  </div>
                </motion.div>
              </form>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  );
}
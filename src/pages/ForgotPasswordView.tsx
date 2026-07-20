import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
import { validateEmail, validateRequired, isFormValid } from '../utils/validation';
import { authApi } from '../services/api/authApi';

interface ForgotPasswordViewProps {
  onBack: () => void;
  onResetSuccess: () => void;
}

const stardustParticles = Array.from({ length: 25 }).map((_, i) => ({
  id: i,
  size: Math.random() * 3 + 1,
  left: Math.random() * 100,
  duration: Math.random() * 15 + 10,
  delay: Math.random() * 10,
}));

export default function ForgotPasswordView({ onBack, onResetSuccess }: ForgotPasswordViewProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<{ email?: string; otp?: string; password?: string; confirmPassword?: string }>({});

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    },
    exit: { opacity: 0, x: -20 }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setErrors({});
    setErrorMessage('');
    setSubmitting(true);

    try {
      await authApi.forgotPassword(email);
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Không thể gửi mã xác nhận. Vui lòng kiểm tra lại email.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!otp || otp.length !== 6) {
      setErrors({ otp: 'Vui lòng nhập mã OTP 6 số hợp lệ' });
      return;
    }

    setErrors({});
    setErrorMessage('');
    setSubmitting(true);

    try {
      await authApi.verifyOtp(email, otp);
      setStep(3);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const fieldErrors: any = {
      password: validateRequired(newPassword, 'Mật khẩu mới'),
      confirmPassword: newPassword !== confirmPassword ? 'Mật khẩu nhập lại không khớp' : ''
    };
    
    if (newPassword && newPassword.length < 6) {
      fieldErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(fieldErrors);
    if (!isFormValid(fieldErrors)) return;

    setErrors({});
    setErrorMessage('');
    setSubmitting(true);

    try {
      await authApi.resetPassword(email, otp, newPassword);
      onResetSuccess();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative h-screen w-screen bg-[#020205] flex items-center justify-center p-4 overflow-hidden selection:bg-indigo-500/30 text-white">
      
      {/* Bụi sao bay lơ lửng */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stardustParticles.map(p => (
          <motion.div
            key={p.id}
            initial={{ y: '110vh', opacity: 0, x: `${p.left}vw` }}
            animate={{ y: '-10vh', opacity: [0, 0.8, 0] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
            className="absolute rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            style={{ width: p.size, height: p.size }}
          />
        ))}
      </div>

      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none -translate-x-1/3 translate-y-1/3" />

      <div className="relative z-10 w-full max-w-[1000px] min-h-[600px] rounded-[2.5rem] bg-white/[0.02] border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Cột trái */}
        <div className="hidden md:flex md:w-1/2 p-8 flex-col justify-center relative z-10 border-r border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 w-full">
            <div className="flex items-center gap-2 mb-12">
              <button
                onClick={onBack}
                className="flex items-center gap-2 group cursor-pointer bg-transparent border-none p-0"
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
              Khôi phục <br />
              <motion.span 
                animate={{ backgroundPosition: ["-200% center", "200% center"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: "200% auto" }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-cyan-400 inline-block"
              >
                Mật Khẩu
              </motion.span>
            </h1>
            <p className="text-sm text-white/70 max-w-[250px]">
              Đừng lo lắng! Hãy làm theo các bước bên cạnh để lấy lại quyền truy cập vào tài khoản của bạn.
            </p>
          </div>
        </div>

        {/* Cột phải: Glass Form */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center relative z-20 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-sm w-full mx-auto my-auto relative z-30">
            
            <AnimatePresence mode="wait">
              {/* STEP 1: ENTER EMAIL */}
              {step === 1 && (
                <motion.div key="step1" variants={containerVariants} initial="hidden" animate="show" exit="exit">
                  <motion.div variants={itemVariants} className="mb-8">
                    <button onClick={onBack} className="text-xs text-white/40 hover:text-white flex items-center gap-1 mb-4 transition-colors">
                      &larr; Quay lại
                    </button>
                    <h2 className="font-display text-2xl font-bold mb-1">Quên mật khẩu?</h2>
                    <p className="text-white/60 text-xs">Nhập email của bạn để nhận mã OTP khôi phục.</p>
                  </motion.div>

                  {errorMessage && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">warning</span> {errorMessage}
                    </motion.div>
                  )}

                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <motion.div variants={itemVariants} className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Địa chỉ Email</label>
                      <div className="relative group/input">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-white transition-colors" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); setErrorMessage(''); }}
                          className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl outline-none focus:bg-white/20 transition-all text-white placeholder:text-white/40 text-sm shadow-inner ${errors.email ? 'border-red-500/60 focus:border-red-400' : 'border-white/20 focus:border-indigo-400'}`}
                          placeholder="nguoidung@email.com"
                        />
                      </div>
                      {errors.email && <p className="text-[11px] text-red-400 ml-1">{errors.email}</p>}
                    </motion.div>

                    <motion.div variants={itemVariants} className="pt-2">
                      <motion.button
                        whileHover={submitting ? undefined : { scale: 1.02 }}
                        whileTap={submitting ? undefined : { scale: 0.98 }}
                        type="submit"
                        disabled={submitting}
                        className="w-full relative group/btn overflow-hidden bg-indigo-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-indigo-500 hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <span className="relative z-10">{submitting ? 'Đang gửi...' : 'Gửi Mã OTP'}</span>
                        {!submitting && <ArrowRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 transition-transform" />}
                        {submitting && <Loader2 className="w-4 h-4 relative z-10 animate-spin" />}
                      </motion.button>
                    </motion.div>
                  </form>
                </motion.div>
              )}

              {/* STEP 2: ENTER OTP */}
              {step === 2 && (
                <motion.div key="step2" variants={containerVariants} initial="hidden" animate="show" exit="exit">
                  <motion.div variants={itemVariants} className="mb-8">
                    <button onClick={() => setStep(1)} className="text-xs text-white/40 hover:text-white flex items-center gap-1 mb-4 transition-colors">
                      &larr; Quay lại
                    </button>
                    <h2 className="font-display text-2xl font-bold mb-1">Xác Thực OTP</h2>
                    <p className="text-white/60 text-xs">Mã 6 số đã được gửi tới <b>{email}</b>. Kiểm tra cả hộp thư rác nhé.</p>
                  </motion.div>

                  {errorMessage && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">warning</span> {errorMessage}
                    </motion.div>
                  )}

                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <motion.div variants={itemVariants} className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Mã OTP (6 Số)</label>
                      <div className="relative group/input">
                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-white transition-colors" />
                        <input
                          type="text"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setErrors(p => ({ ...p, otp: '' })); setErrorMessage(''); }}
                          className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl outline-none focus:bg-white/20 transition-all text-white placeholder:text-white/40 text-sm shadow-inner text-center tracking-[0.5em] font-mono ${errors.otp ? 'border-red-500/60 focus:border-red-400' : 'border-white/20 focus:border-indigo-400'}`}
                          placeholder="000000"
                        />
                      </div>
                      {errors.otp && <p className="text-[11px] text-red-400 ml-1 text-center">{errors.otp}</p>}
                    </motion.div>

                    <motion.div variants={itemVariants} className="pt-2">
                      <motion.button
                        whileHover={submitting ? undefined : { scale: 1.02 }}
                        whileTap={submitting ? undefined : { scale: 0.98 }}
                        type="submit"
                        disabled={submitting || otp.length !== 6}
                        className="w-full relative group/btn overflow-hidden bg-indigo-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-indigo-500 hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <span className="relative z-10">{submitting ? 'Đang xác thực...' : 'Xác Nhận'}</span>
                        {!submitting && <CheckCircle2 className="w-4 h-4 relative z-10" />}
                        {submitting && <Loader2 className="w-4 h-4 relative z-10 animate-spin" />}
                      </motion.button>
                    </motion.div>
                  </form>
                </motion.div>
              )}

              {/* STEP 3: NEW PASSWORD */}
              {step === 3 && (
                <motion.div key="step3" variants={containerVariants} initial="hidden" animate="show" exit="exit">
                  <motion.div variants={itemVariants} className="mb-8">
                    <h2 className="font-display text-2xl font-bold mb-1">Mật Khẩu Mới</h2>
                    <p className="text-white/60 text-xs">Vui lòng thiết lập mật khẩu mới cho tài khoản của bạn.</p>
                  </motion.div>

                  {errorMessage && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">warning</span> {errorMessage}
                    </motion.div>
                  )}

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <motion.div variants={itemVariants} className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                      <div className="relative group/input">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-white transition-colors" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => { setNewPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); setErrorMessage(''); }}
                          className={`w-full pl-10 pr-10 py-3 bg-white/10 border rounded-xl outline-none focus:bg-white/20 transition-all text-white placeholder:text-white/40 text-sm shadow-inner ${errors.password ? 'border-red-500/60 focus:border-red-400' : 'border-white/20 focus:border-indigo-400'}`}
                          placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-[11px] text-red-400 ml-1">{errors.password}</p>}
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Nhập lại mật khẩu</label>
                      <div className="relative group/input">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-white transition-colors" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: '' })); setErrorMessage(''); }}
                          className={`w-full pl-10 pr-10 py-3 bg-white/10 border rounded-xl outline-none focus:bg-white/20 transition-all text-white placeholder:text-white/40 text-sm shadow-inner ${errors.confirmPassword ? 'border-red-500/60 focus:border-red-400' : 'border-white/20 focus:border-indigo-400'}`}
                          placeholder="••••••••"
                        />
                      </div>
                      {errors.confirmPassword && <p className="text-[11px] text-red-400 ml-1">{errors.confirmPassword}</p>}
                    </motion.div>

                    <motion.div variants={itemVariants} className="pt-2">
                      <motion.button
                        whileHover={submitting ? undefined : { scale: 1.02 }}
                        whileTap={submitting ? undefined : { scale: 0.98 }}
                        type="submit"
                        disabled={submitting}
                        className="w-full relative group/btn overflow-hidden bg-indigo-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-indigo-500 hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <span className="relative z-10">{submitting ? 'Đang đổi mật khẩu...' : 'Xác Nhận Đổi Mật Khẩu'}</span>
                        {!submitting && <ArrowRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 transition-transform" />}
                        {submitting && <Loader2 className="w-4 h-4 relative z-10 animate-spin" />}
                      </motion.button>
                    </motion.div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
}

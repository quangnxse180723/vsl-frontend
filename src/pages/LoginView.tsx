import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { validateEmail, validateRequired, isFormValid } from '../utils/validation';

interface LoginViewProps {
  onLogin: (email: string, password?: string) => Promise<void>;
  onSwitchToRegister: () => void;
  onBack?: () => void;
}

const stardustParticles = Array.from({ length: 25 }).map((_, i) => ({
  id: i,
  size: Math.random() * 3 + 1,
  left: Math.random() * 100,
  duration: Math.random() * 15 + 10,
  delay: Math.random() * 10,
}));

export default function LoginView({ onLogin, onSwitchToRegister, onBack }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email: string; password: string }>({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const fieldErrors = {
      email: validateEmail(email),
      password: validateRequired(password, 'Mật khẩu'),
    };
    setErrors(fieldErrors);
    if (!isFormValid(fieldErrors)) return;

    setErrorMessage('');
    setSubmitting(true);
    try {
      await onLogin(email, password);
      // Thanh cong: App chuyen sang giao dien chinh.
    } catch (err: any) {
      // Hien thong bao sai email/mat khau (hoac tai khoan bi khoa) ngay tren man
      // dang nhap thay vi khong phan hoi gi.
      setErrorMessage(err?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
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

      {/* HIỆU ỨNG 2: Background Cực quang */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, rgba(79,70,229,0) 70%)' }}
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], y: [0, -50, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0) 70%)' }}
      />

      {/* Container chính */}
      <div className="relative z-10 w-full max-w-[900px] max-h-[95vh] flex flex-col md:flex-row rounded-[2rem] overflow-hidden border border-white/20 shadow-2xl bg-white/[0.02] backdrop-blur-lg">
        
        {/* Cột trái: Artwork (Đã bỏ hiệu ứng thụt ra thụt vô, khôi phục lại cố định) */}
        <div className="hidden md:flex md:w-1/2 p-8 flex-col justify-center relative z-10 border-r border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 w-full">
            <div className="flex items-center gap-2 mb-12">
              <button
                onClick={onBack}
                className="flex items-center gap-2 group cursor-pointer bg-transparent border-none p-0"
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
              Làm chủ <br />
              <motion.span 
                animate={{ backgroundPosition: ["-200% center", "200% center"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: "200% auto" }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-cyan-400 inline-block"
              >
                Ngôn Ngữ Ký Hiệu
              </motion.span>
            </h1>
            <p className="text-sm text-white/70 max-w-[250px]">
              Bước vào không gian học tập tương tác. Luyện tập và hoàn thiện từng cử chỉ với công nghệ AI theo thời gian thực.
            </p>
          </div>
        </div>

        {/* Cột phải: Glass Form */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center relative z-20 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-sm w-full mx-auto my-auto relative z-30">
            
            <motion.div variants={itemVariants} className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-1">Cổng Đăng Nhập</h2>
              <p className="text-white/60 text-xs">Xác thực danh tính để bắt đầu phiên làm việc AI của bạn.</p>
            </motion.div>

            {errorMessage && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-base">warning</span> {errorMessage}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 relative z-20">
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

              <motion.div variants={itemVariants} className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Mật khẩu</label>
                  <a href="#" className="text-[10px] font-semibold text-indigo-300 hover:text-white transition-colors">Quên Mật Khẩu?</a>
                </div>
                <div className="relative group/input">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-white transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); setErrorMessage(''); }}
                    className={`w-full pl-10 pr-10 py-3 bg-white/10 border rounded-xl outline-none focus:bg-white/20 transition-all text-white placeholder:text-white/40 text-sm shadow-inner ${errors.password ? 'border-red-500/60 focus:border-red-400' : 'border-white/20 focus:border-indigo-400'}`}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
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
                  <span className="relative z-10">{submitting ? 'Đang đăng nhập...' : 'Đăng Nhập Khám Phá'}</span>
                  {submitting
                    ? <Loader2 className="w-4 h-4 relative z-10 animate-spin" />
                    : <ArrowRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 transition-transform" />}
                </motion.button>
              </motion.div>
            </form>

            <motion.div variants={itemVariants} className="mt-6 text-center border-t border-white/10 pt-5 relative z-20">
              <p className="text-white/60 text-xs">
                Chưa có tài khoản? 
                <button type="button" onClick={onSwitchToRegister} className="text-white font-bold ml-1.5 hover:text-indigo-300 transition-colors">
                  Đăng Ký Ngay
                </button>
              </p>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}

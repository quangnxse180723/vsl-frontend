import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowLeft, Sparkles, UserPlus } from 'lucide-react';

interface RegisterViewProps {
  onRegister: (name: string, username: string, email: string, password: string) => void;
  onSwitchToLogin: () => void;
}

const stardustParticles = Array.from({ length: 25 }).map((_, i) => ({
  id: i,
  size: Math.random() * 3 + 1,
  left: Math.random() * 100,
  duration: Math.random() * 15 + 10,
  delay: Math.random() * 10,
}));

export default function RegisterView({ onRegister, onSwitchToLogin }: RegisterViewProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !email || !password) {
      setErrorMessage('Vui lòng điền đầy đủ các trường thông tin.');
      return;
    }
    onRegister(name, username, email, password);
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
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner backdrop-blur-md">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <motion.span 
                animate={{ opacity: [0.7, 1, 0.7], textShadow: ["0px 0px 2px rgba(255,255,255,0.1)", "0px 0px 12px rgba(255,255,255,0.9)", "0px 0px 2px rgba(255,255,255,0.1)"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="font-display text-xl font-bold tracking-tight text-white"
              >
                SignMentor
              </motion.span>
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
              <p className="text-white/60 text-xs">Đăng ký thông tin để hệ thống thiết lập không gian học tập cho bạn.</p>
            </motion.div>

            {errorMessage && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-base">warning</span> {errorMessage}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 relative z-20">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Họ và Tên</label>
                  <div className="relative group/input">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-white transition-colors" />
                    <input
                      type="text" required value={name} onChange={(e) => { setName(e.target.value); setErrorMessage(''); }}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl outline-none focus:bg-white/20 focus:border-indigo-400 transition-all text-white placeholder:text-white/40 text-sm shadow-inner"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Tên Hiển Thị</label>
                  <div className="relative group/input">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-white transition-colors" />
                    <input
                      type="text" required value={username} onChange={(e) => { setUsername(e.target.value); setErrorMessage(''); }}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl outline-none focus:bg-white/20 focus:border-indigo-400 transition-all text-white placeholder:text-white/40 text-sm shadow-inner"
                      placeholder="nguyenvana"
                    />
                  </div>
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Địa Chỉ Email</label>
                <div className="relative group/input">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-white transition-colors" />
                  <input
                    type="email" required value={email} onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl outline-none focus:bg-white/20 focus:border-indigo-400 transition-all text-white placeholder:text-white/40 text-sm shadow-inner"
                    placeholder="nguoidung@email.com"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Mật Khẩu</label>
                <div className="relative group/input">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-white transition-colors" />
                  <input
                    type="password" required value={password} onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl outline-none focus:bg-white/20 focus:border-indigo-400 transition-all text-white placeholder:text-white/40 text-sm shadow-inner"
                    placeholder="••••••••"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full relative group/btn overflow-hidden bg-indigo-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-indigo-500 hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] text-sm"
                >
                  <span className="relative z-10">Hoàn Tất Đăng Ký</span>
                  <UserPlus className="w-4 h-4 relative z-10" />
                </motion.button>
              </motion.div>
            </form>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Sparkles, Hand } from 'lucide-react';

interface LoginViewProps {
  onLogin: (email: string, password?: string) => void;
  onSwitchToRegister: () => void;
}

export default function LoginView({ onLogin, onSwitchToRegister }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Vui lòng nhập email.');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }
    onLogin(email, password);
  };

  const handleSocialLogin = (platform: string) => {
    onLogin(`${platform.toLowerCase()}user@signmentor.com`);
  };

  return (
    <div className="bg-mesh min-h-screen flex items-center justify-center font-body-md text-on-surface p-4 md:p-12 w-full">
      <main className="w-full max-w-[1100px] flex flex-col md:flex-row bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden border border-outline-variant/30">
        
        {/* Left Side: Brand Visual Section */}
        <section className="hidden md:flex md:w-1/2 bg-primary-container p-10 flex-col justify-between relative overflow-hidden text-on-primary-container">
          {/* Decorative Patterns */}
          <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-white/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-primary/20 rounded-full blur-[80px]"></div>
          
          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-12">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center border border-white/30 shadow-md">
                <span className="material-symbols-outlined text-white text-3xl">sign_language</span>
              </div>
              <span className="font-headline-md text-2xl font-bold tracking-tight text-white">SignMentor</span>
            </div>

            <h1 className="font-display text-4xl lg:text-5xl font-extrabold leading-tight mb-6 text-white drop-shadow-sm">
              Connect with <br /> every gesture.
            </h1>
            <p className="font-body-lg text-lg text-white/80 max-w-sm">
              Master sign language with AI-powered feedback and a community that speaks your language.
            </p>
          </div>

          <div className="relative z-10 mt-12">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-white text-2xl">psychology</span>
                <span className="font-label-bold text-white text-sm">AI Practice Active</span>
              </div>
              <p className="text-white/90 text-sm italic">
                &ldquo;Your hand positions are 92% more accurate this week. Keep up the great work!&rdquo;
              </p>
            </div>
          </div>

          {/* Large decorative hand logo at back */}
          <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none transform translate-y-1/4 translate-x-1/4">
            <span className="material-symbols-outlined text-[300px] text-white">waving_hand</span>
          </div>
        </section>

        {/* Right Side: LogIn Credentials Form */}
        <section className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
          {/* Mobile Welcome Title */}
          <div className="md:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">sign_language</span>
            </div>
            <span className="font-headline-md text-xl font-bold text-primary">SignMentor</span>
          </div>

          <header className="mb-8">
            <h2 className="font-headline-lg text-3xl text-primary mb-2">Welcome back</h2>
            <p className="font-body-md text-on-surface-variant">Please enter your details to sign in.</p>
          </header>

          {errorMessage && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container text-sm rounded-lg font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-bold text-sm text-on-surface-variant" htmlFor="email-input">
                Email Address
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                  mail
                </span>
                <input
                  id="email-input"
                  className="w-full pl-11 pr-3 py-3 bg-surface-container-low border-2 border-transparent rounded-lg focus:border-primary focus:ring-0 transition-all font-body-md text-on-surface placeholder:text-outline-variant outline-none"
                  placeholder="name@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage('');
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="font-label-bold text-sm text-on-surface-variant" htmlFor="password-input">
                  Password
                </label>
                <a
                  className="text-xs font-label-bold text-secondary hover:underline"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Chức năng khôi phục mật khẩu sẽ gửi email đặt lại mã PIN.');
                  }}
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                  lock
                </span>
                <input
                  id="password-input"
                  className="w-full pl-11 pr-11 py-3 bg-surface-container-low border-2 border-transparent rounded-lg focus:border-primary focus:ring-0 transition-all font-body-md text-on-surface placeholder:text-outline-variant outline-none"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage('');
                  }}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Me Label */}
            <div className="flex items-center gap-2">
              <input
                className="w-4 h-4 text-primary bg-surface-container-low border-outline-variant rounded focus:ring-primary/20 cursor-pointer"
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label className="text-xs text-on-surface-variant select-none cursor-pointer" htmlFor="remember">
                Remember for 30 days
              </label>
            </div>

            {/* Sign In Trigger */}
            <button
              className="w-full py-3 bg-primary text-on-primary font-label-bold rounded-lg shadow-md active-scale transition-all hover:bg-primary/95 flex items-center justify-center gap-2"
              type="submit"
            >
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-outline-variant/30"></div>
            <span className="flex-shrink mx-3 text-xs text-outline font-medium">Or continue with</span>
            <div className="flex-grow border-t border-outline-variant/30"></div>
          </div>

          {/* Social Authentication */}
          <div className="grid grid-cols-2 gap-3">
            <button
              className="flex items-center justify-center gap-2 py-3 px-4 border border-outline-variant/50 rounded-lg font-label-bold text-on-surface hover:bg-surface-container-high transition-colors active-scale"
              type="button"
              onClick={() => handleSocialLogin('Google')}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              Google
            </button>
            <button
              className="flex items-center justify-center gap-2 py-3 px-4 border border-outline-variant/50 rounded-lg font-label-bold text-on-surface hover:bg-surface-container-high transition-colors active-scale"
              type="button"
              onClick={() => handleSocialLogin('Apple')}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-51.1-20.8-83.6-20.8-42.3 0-82.3 24.3-104.1 62.4-45.2 78.4-11.6 195.1 32.3 258.9 21.4 31 46.8 65.6 80.4 65.1 31.8-.5 44-19.4 82.5-19.4s50.7 19.4 84.1 18.7c34.1-.7 56.4-31.2 77.3-61.9 24.2-35.4 34.2-69.7 34.7-71.4-1.1-.5-66.7-25.6-67.4-103.5zm-64.1-163.6c15.2-18.4 25.1-43.9 22.2-69.4-21.9 1-48.4 14.9-64 33-14.1 16.1-26.3 42.1-22.9 67.1 24.5 1.9 49.3-12.3 64.7-30.7z"></path>
              </svg>
              Apple
            </button>
          </div>

          <footer className="mt-8 text-center">
            <p className="text-body-md text-on-surface-variant">
              Don't have an account? 
              <button 
                type="button" 
                onClick={onSwitchToRegister}
                className="font-label-bold text-primary hover:underline ml-1"
              >
                Create an account
              </button>
            </p>
          </footer>
        </section>
      </main>
    </div>
  );
}

import React, { useState } from 'react';

interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<string | null>;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setErrorMessage('Vui lòng nhập email.'); return; }
    if (!password) { setErrorMessage('Vui lòng nhập mật khẩu.'); return; }

    setIsLoading(true);
    setErrorMessage('');
    const err = await onLogin(email, password);
    setIsLoading(false);
    if (err) setErrorMessage(err);
  };

  return (
    <div className="bg-mesh min-h-screen flex items-center justify-center font-body-md text-on-surface p-4 md:p-12 w-full">
      <main className="w-full max-w-[1100px] flex flex-col md:flex-row bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden border border-outline-variant/30">

        {/* Left: Brand */}
        <section className="hidden md:flex md:w-1/2 bg-primary-container p-10 flex-col justify-between relative overflow-hidden text-on-primary-container">
          <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-white/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-primary/20 rounded-full blur-[80px]"></div>

          <div className="relative z-10">
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

          <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none transform translate-y-1/4 translate-x-1/4">
            <span className="material-symbols-outlined text-[300px] text-white">waving_hand</span>
          </div>
        </section>

        {/* Right: Form */}
        <section className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
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
                  onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="font-label-bold text-sm text-on-surface-variant" htmlFor="password-input">
                  Password
                </label>
                <a
                  className="text-xs font-label-bold text-secondary hover:underline"
                  href="#"
                  onClick={(e) => { e.preventDefault(); alert('Chức năng khôi phục mật khẩu sẽ gửi email đặt lại mã PIN.'); }}
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
                  onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
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

            <button
              className="w-full py-3 bg-primary text-on-primary font-label-bold rounded-lg shadow-md active-scale transition-all hover:bg-primary/95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

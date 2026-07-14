import React, { useState, useEffect } from 'react';

// Starry night mountain background - matches the background in the dashboard banner
const BANNER_BG = 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&auto=format&fit=crop&q=80';

// App screenshot mock - dashboard UI preview
const DASHBOARD_PREVIEW = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onNavigate?: (tab: 'dashboard' | 'lessons' | 'practice' | 'blog') => void;
  currentUser?: { name: string; avatar?: string } | null;
  realStats?: { streak: number; accuracy: number; learnedCount: number } | null;
  realLessons?: { title: string; progress: number }[];
}

export default function LandingPage({ onGetStarted, onLogin, onNavigate, currentUser, realStats, realLessons }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const stats = [
    { value: '5000+', label: 'Học Viên', color: '#6C8EF5' },
    { value: '98%', label: 'Tỷ Lệ Hài Lòng', color: '#F5A623' },
    { value: '200+', label: 'Bài Học Tương Tác', color: '#F5A623' },
  ];

  const features = [
    {
      icon: 'psychology',
      color: '#6C8EF5',
      bg: 'rgba(108,142,245,0.12)',
      title: 'Nhận Diện AI Chính Xác',
      desc: 'Camera AI phân tích từng chuyển động tay của bạn, cung cấp phản hồi tức thời và sửa lỗi ngay lập tức.',
    },
    {
      icon: 'tune',
      color: '#4ECDC4',
      bg: 'rgba(78,205,196,0.12)',
      title: 'Lộ Trình Học Cá Nhân Hóa',
      desc: 'Bài học tự động điều chỉnh dựa trên tốc độ và khả năng tiếp thu của riêng bạn, từ cơ bản đến nâng cao.',
    },
    {
      icon: 'forum',
      color: '#F5A623',
      bg: 'rgba(245,166,35,0.12)',
      title: 'Cộng Đồng Kết Nối',
      desc: 'Tham gia diễn đàn, thực hành cùng bạn bè và kết nối với những người đam mê ngôn ngữ ký hiệu khác.',
    },
  ];

  return (
    <div style={{ fontFamily: "'Inter', 'Outfit', sans-serif", background: '#0A0E1A', minHeight: '100vh', color: '#fff' }}>

      {/* ─── LOGIN PROMPT MODAL ─── */}
      {loginPrompt && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setLoginPrompt(null)}>
          <div style={{
            background: 'linear-gradient(135deg, #0D1120 0%, #141828 100%)',
            border: '1px solid rgba(108,142,245,0.3)',
            borderRadius: 20, padding: '40px 36px', maxWidth: 400, width: '90%',
            textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>
              Vui lòng đăng nhập
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: '0 0 28px', lineHeight: 1.6 }}>
              Bạn cần đăng nhập để truy cập <strong style={{ color: '#6C8EF5' }}>{loginPrompt}</strong>.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setLoginPrompt(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 14,
                  padding: '11px 22px', borderRadius: 10, cursor: 'pointer',
                }}
              >Để Sau</button>
              <button
                onClick={() => { setLoginPrompt(null); onLogin(); }}
                style={{
                  background: 'linear-gradient(135deg, #6C8EF5 0%, #5a7de8 100%)',
                  border: 'none', color: '#fff', fontWeight: 700, fontSize: 14,
                  padding: '11px 28px', borderRadius: 10, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(108,142,245,0.4)',
                }}
              >Đăng Nhập Ngay</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── NAVBAR ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(10,14,26,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
        transition: 'all 0.3s ease',
        padding: '0 5%',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #6C8EF5 0%, #4ECDC4 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(108,142,245,0.4)',
            }}>
              <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>sign_language</span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#fff', lineHeight: 1.1 }}>SignMentor</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Học Ngôn Ngữ Ký Hiệu Cùng AI</div>
            </div>
          </div>

          {/* Desktop nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="desktop-nav">
            {[
              { label: 'Trang Chủ', requireLogin: false, tab: 'dashboard' as const },
              { label: 'Bài Học', requireLogin: true, tab: 'lessons' as const },
              { label: 'Luyện Tập AI', requireLogin: true, tab: 'practice' as const },
              { label: 'Cộng Đồng', requireLogin: true, tab: 'blog' as const },
            ].map(({ label, requireLogin, tab }) => (
              <a key={label} href="#"
                onClick={e => {
                  e.preventDefault();
                  if (requireLogin) {
                    if (currentUser && onNavigate) {
                      onNavigate(tab);
                    } else {
                      setLoginPrompt(label);
                    }
                  } else if (currentUser && onNavigate) {
                    // For "Trang Chủ", maybe just scroll to top if not logged in, but if logged in, go to dashboard?
                    // Actually, if it's "Trang Chủ", we usually just scroll up, but let's let them go to dashboard if they want.
                    // Wait, Trang Chủ means Landing Page. Let's just do nothing (scroll to top) if it's Trang Chủ.
                    if (label !== 'Trang Chủ') {
                       onNavigate(tab);
                    } else {
                       window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                style={{
                  color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontWeight: 600,
                  fontSize: 14, padding: '8px 14px', borderRadius: 8,
                  transition: 'color 0.2s', cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
              >{label}</a>
            ))}
          </div>

          {/* Auth buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {currentUser ? (
              // Logged in: show avatar + name + "Vào App" button
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(108,142,245,0.5)' }} />
                  ) : (
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6C8EF5, #4ECDC4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: '#fff',
                    }}>{currentUser.name.charAt(0).toUpperCase()}</div>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{currentUser.name}</span>
                </div>
                <button
                  onClick={onLogin}
                  style={{
                    background: 'linear-gradient(135deg, #6C8EF5 0%, #5a7de8 100%)',
                    border: 'none', color: '#fff', fontWeight: 700, fontSize: 14,
                    padding: '9px 20px', borderRadius: 10, cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(108,142,245,0.4)', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>dashboard</span>
                  Vào Dashboard
                </button>
              </>
            ) : (
              // Not logged in: show Login + Get Started
              <>
                <button
                  onClick={onLogin}
                  style={{
                    background: 'transparent', border: '1.5px solid rgba(255,255,255,0.25)',
                    color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: 14,
                    padding: '9px 20px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                >Đăng Nhập</button>
                <button
                  onClick={onGetStarted}
                  style={{
                    background: 'linear-gradient(135deg, #6C8EF5 0%, #5a7de8 100%)',
                    border: 'none', color: '#fff', fontWeight: 700, fontSize: 14,
                    padding: '10px 22px', borderRadius: 10, cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(108,142,245,0.45)', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(108,142,245,0.6)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(108,142,245,0.45)'; }}
                >Bắt Đầu</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO / BANNER ─── */}
      <section style={{ position: 'relative', minHeight: '92vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* Starry night mountain background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${BANNER_BG})`,
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
          filter: 'brightness(0.55)',
        }} />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(10,14,26,0.85) 45%, rgba(10,14,26,0.15) 100%)',
        }} />
        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 200,
          background: 'linear-gradient(to bottom, transparent, #0A0E1A)',
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '100px 5% 60px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 60, flexWrap: 'wrap' }}>
            {/* Left: text content */}
            <div style={{ flex: '1 1 400px', minWidth: 300 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24,
                background: 'rgba(108,142,245,0.15)', border: '1px solid rgba(108,142,245,0.3)',
                borderRadius: 20, padding: '6px 16px',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6C8EF5', display: 'inline-block', boxShadow: '0 0 8px #6C8EF5' }} />
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em' }}>CHÀO MỪNG BẠN ĐẾN VỚI</span>
              </div>

              <h1 style={{ fontSize: 'clamp(36px, 5vw, 58px)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
                Học Ngôn Ngữ<br />
                Ký Hiệu<br />
                <span style={{ color: '#6C8EF5' }}>Cùng AI</span>
              </h1>

              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 36, maxWidth: 420 }}>
                SignMentor AI luôn sẵn sàng đồng hành cùng bạn. Nắm vững ngôn ngữ ký hiệu thông qua phản hồi thực tế và lộ trình cá nhân hóa.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <button
                  onClick={onGetStarted}
                  style={{
                    background: 'linear-gradient(135deg, #6C8EF5 0%, #5a7de8 100%)',
                    border: 'none', color: '#fff', fontWeight: 700, fontSize: 16,
                    padding: '14px 32px', borderRadius: 12, cursor: 'pointer',
                    boxShadow: '0 4px 24px rgba(108,142,245,0.5)', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(108,142,245,0.65)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(108,142,245,0.5)'; }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  Bắt Đầu Ngay
                </button>
                <button
                  onClick={onLogin}
                  style={{
                    background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
                    border: '1.5px solid rgba(255,255,255,0.2)', color: '#fff',
                    fontWeight: 600, fontSize: 15, padding: '13px 28px', borderRadius: 12,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                >Đăng Nhập</button>
              </div>
            </div>

            {/* Right: App screenshot preview */}
            <div style={{ flex: '1 1 320px', minWidth: 280, position: 'relative' }}>
              <div style={{
                background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
                padding: 16, boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
                transform: 'perspective(1000px) rotateY(-5deg) rotateX(2deg)',
                transition: 'transform 0.3s ease',
              }}>
                {/* Fake browser bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
                  <div style={{ flex: 1, height: 20, borderRadius: 4, background: 'rgba(255,255,255,0.07)', marginLeft: 8 }} />
                </div>
                {/* Dashboard mock */}
                <div style={{ background: 'rgba(10,14,26,0.8)', borderRadius: 12, overflow: 'hidden' }}>
                  {/* Dashboard header */}
                  <div style={{
                    backgroundImage: `url(${BANNER_BG})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    padding: '20px 20px 16px', position: 'relative',
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,14,26,0.6)' }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6C8EF5', display: 'inline-block' }} />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '0.08em' }}>CHÀO MỪNG TRỞ LẠI</span>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
                        {currentUser ? (
                          <>Xin chào, <span style={{ color: '#6C8EF5' }}>{currentUser.name}</span>! 👋</>
                        ) : 'Xin chào! 👋'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontSize: 30 }}>🦦</div>
                        <div style={{
                          background: 'rgba(255,255,255,0.9)', borderRadius: 20,
                          padding: '8px 14px', fontSize: 11, color: '#333', fontWeight: 500,
                        }}>Giữ chuỗi ngày học liên tục để mở khóa huy hiệu ...</div>
                      </div>
                    </div>
                  </div>
                  {/* Stats row */}
                  <div style={{ padding: '12px 16px', display: 'flex', gap: 10 }}>
                    {[
                      { icon: 'local_fire_department', val: realStats ? String(realStats.streak) : '5', label: 'Ngày', color: '#F5A623' },
                      { icon: 'check_circle', val: realStats ? `${realStats.accuracy}%` : '89%', label: 'Chính xác', color: '#4ECDC4' },
                      { icon: 'school', val: realStats ? String(realStats.learnedCount) : '24', label: 'Từ học', color: '#6C8EF5' },
                    ].map(s => (
                      <div key={s.label} style={{
                        flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 10,
                        padding: '8px 6px', textAlign: 'center',
                      }}>
                        <span className="material-symbols-outlined" style={{ color: s.color, fontSize: 16, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{s.val}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Lesson cards */}
                  <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(realLessons && realLessons.length > 0
                      ? realLessons.slice(0, 2)
                      : [{ title: 'Chào Hỏi & Hoạt Động', progress: 0 }, { title: 'Trang thái & Cảm xúc', progress: 0 }]
                    ).map(lesson => (
                      <div key={lesson.title} style={{
                        background: 'rgba(255,255,255,0.04)', borderRadius: 10,
                        padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6C8EF5, #4ECDC4)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lesson.title}</div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                            {lesson.progress > 0 ? `Tiến độ: ${lesson.progress}%` : 'Hoàn thành 3 bài học nữa để...'}
                          </div>
                          {lesson.progress > 0 && (
                            <div style={{ marginTop: 4, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }}>
                              <div style={{ width: `${lesson.progress}%`, height: '100%', borderRadius: 2, background: '#6C8EF5' }} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Glow effect */}
              <div style={{
                position: 'absolute', inset: '-20px', borderRadius: 32,
                background: 'radial-gradient(ellipse at center, rgba(108,142,245,0.15) 0%, transparent 70%)',
                zIndex: -1, pointerEvents: 'none',
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section style={{ padding: '60px 5%', background: '#0D1120' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 80, flexWrap: 'wrap' }}>
          {stats.map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section style={{ padding: '80px 5%', background: '#0A0E1A' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, margin: '0 0 16px' }}>
              Tại Sao Chọn <span style={{ color: '#6C8EF5' }}>SignMentor?</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
              Trải nghiệm học tập hiện đại, kết hợp sức mạnh của trí tuệ nhân tạo để mang lại kết quả tốt nhất.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {features.map((f) => (
              <div key={f.title} style={{
                flex: '1 1 260px', minWidth: 240,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20, padding: '32px 28px', transition: 'all 0.3s ease',
                cursor: 'default',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(108,142,245,0.3)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14, background: f.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                }}>
                  <span className="material-symbols-outlined" style={{ color: f.color, fontSize: 26, fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px', color: '#fff' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section style={{ padding: '80px 5%', background: '#0D1120' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(135deg, #2d3a8c 0%, #4F3BA9 50%, #3730a3 100%)',
            borderRadius: 24, padding: 'clamp(40px, 6vw, 64px)',
            textAlign: 'center', position: 'relative', overflow: 'hidden',
            border: '1px solid rgba(108,142,245,0.2)',
          }}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 42, marginBottom: 16 }}>🦦</div>
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, margin: '0 0 16px', color: '#fff' }}>
                Sẵn Sàng Bắt Đầu Hành Trình Của Bạn?
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', marginBottom: 36, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>
                Tham gia miễn phí hôm nay và khám phá cách SignMentor có thể giúp bạn giao tiếp không giới hạn.
              </p>
              <button
                onClick={onGetStarted}
                style={{
                  background: 'rgba(255,255,255,0.95)', color: '#3730a3',
                  border: 'none', fontWeight: 800, fontSize: 16,
                  padding: '14px 36px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'rgba(255,255,255,0.95)'; }}
              >Đăng Ký Miễn Phí</button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: '#080B14', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '32px 5%' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: '#6C8EF5' }}>SignMentor</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
            © 2024 SignMentor AI. Kết nối mọi người qua ngôn ngữ ký hiệu.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Chính Sách Bảo Mật', 'Điều Khoản Dịch Vụ', 'Trung Tâm Hỗ Trợ', 'Liên Hệ'].map(link => (
              <a key={link} href="#" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.2s', fontWeight: 500 }}
                onMouseEnter={e => e.currentTarget.style.color = '#6C8EF5'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              >{link}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}

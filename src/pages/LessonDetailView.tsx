import React, { useState } from 'react';
import { Lesson, Vocabulary } from '../types';
import { Sparkles, ArrowLeft, CheckCircle, Brain, Play, ShieldAlert } from 'lucide-react';

interface LessonDetailViewProps {
  lesson: Lesson;
  vocabList: Vocabulary[];
  onBack: () => void;
  onLaunchPractice: (lessonId: string, initialSign?: string) => void;
}

export default function LessonDetailView({
  lesson,
  vocabList,
  onBack,
  onLaunchPractice
}: LessonDetailViewProps) {
  // Find vocabulary items that belong to this lesson
  const currentVocabItems = vocabList.filter(v => lesson.vocabulary.includes(v.id));
  
  // Track currently active vocabulary item in the HD Player
  const [activeVocab, setActiveVocab] = useState<Vocabulary | null>(
    currentVocabItems.length > 0 ? currentVocabItems[0] : null
  );

  return (
    <div className="space-y-6 animate-fade-in text-on-surface">
      {/* Breadcrumbs and navigation back */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
        <div className="flex items-center space-x-2">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-surface-container-low rounded-lg transition-colors flex items-center justify-center text-outline hover:text-primary active-scale"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          
          <div className="flex items-center space-x-1.5 text-xs text-outline font-semibold select-none">
            <span>Bài Học</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span>{lesson.category}</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary">{lesson.title}</span>
          </div>
        </div>

        {/* Lesson mastery badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-outline">Trạng thái bài học:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            lesson.progress === 100
              ? 'bg-green-600/15 text-green-700'
              : 'bg-amber-500/15 text-amber-700'
          }`}>
            {lesson.progress === 100 ? 'Đã thành thạo (100%)' : `Đang học (${lesson.progress}%)`}
          </span>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        
        {/* Left Column: HD Player + Tips (8/12 wide) */}
        <div className="lg:col-span-8 space-y-6">
          <header className="space-y-1">
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-[#111111]">
              {activeVocab ? `${lesson.category}: ${activeVocab.name}` : lesson.title}
            </h2>
            <p className="text-sm text-on-surface-variant">
              {activeVocab ? activeVocab.description : lesson.description}
            </p>
          </header>

          {/* HD Player block */}
          <div className="rounded-2xl overflow-hidden bg-black relative elevation-2 aspect-video group">
            {activeVocab ? (
              activeVocab.videoUrl ? (
                <video
                  key={activeVocab.id}
                  className="w-full h-full object-cover"
                  src={activeVocab.videoUrl}
                  poster={activeVocab.image}
                  controls
                  autoPlay
                  muted
                  loop
                />
              ) : (
                <img
                  className="w-full h-full object-cover"
                  src={activeVocab.image}
                  alt={activeVocab.name}
                />
              )
            ) : (
              <img
                className="w-full h-full object-cover"
                src={lesson.image}
                alt={lesson.title}
              />
            )}
            
            {/* Visual HUD overlays */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
              Trình Diễn HD
            </div>

            <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">filter_center_focus</span>
              Khu Vực Theo Dõi Cử Chỉ
            </div>
          </div>

          {/* Tips Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expert Tip card */}
            <div className="glass-card p-5 rounded-xl border border-primary/20 space-y-3 shadow-sm">
              <div className="flex items-center space-x-2 text-primary font-bold">
                <span className="material-symbols-outlined text-xl">emoji_objects</span>
                <h4 className="font-label-bold text-sm">Mẹo Từ Chuyên Gia</h4>
              </div>
              <p className="text-on-surface-variant text-xs leading-relaxed">
                {lesson.tips || "Chú ý hướng lòng bàn tay! Giữ cổ tay thẳng giúp mạng nơ-ron thị giác máy tính xử lý tọa độ chính xác hơn."}
              </p>
            </div>

            {/* Common Mistakes card */}
            <div className="glass-card p-5 rounded-xl border border-error/20 space-y-3 shadow-sm">
              <div className="flex items-center space-x-2 text-error font-bold">
                <span className="material-symbols-outlined text-xl">warning</span>
                <h4 className="font-label-bold text-sm">Lỗi Thường Gặp</h4>
              </div>
              <p className="text-on-surface-variant text-xs leading-relaxed">
                {lesson.mistakes || "Tránh để cẳng tay hạ thấp hơn ngực hoặc gù lưng. Giao tiếp chuẩn luôn diễn ra trong vùng thoải mái phía trước cơ thể."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Vocabulary list & Verify (4/12 wide) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Verify Card */}
          <div className="p-6 rounded-2xl bg-primary text-on-primary elevation-1 space-y-4 shadow-md relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="font-display text-xl font-bold mb-1">Sẵn sàng kiểm tra?</h3>
              <p className="text-xs opacity-90 leading-relaxed mb-4">
                Dùng camera của bạn và AI mentor để kiểm tra độ chính xác hình bàn tay ngay lập tức.
              </p>
              <button
                onClick={() => onLaunchPractice(lesson.id, activeVocab?.name)}
                className="w-full active-scale-lg py-3 bg-white text-primary rounded-xl font-bold flex items-center justify-center gap-2 text-xs shadow-md hover:bg-slate-50 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">videocam</span>
                Kiểm Tra Với AI Trực Tiếp
              </button>
            </div>
            {/* Ambient bubble decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/5 rounded-full pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
          </div>

          {/* Vocabulary List card */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-4">
            <header className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
              <h3 className="font-display text-lg font-bold text-on-surface">Từ Vựng</h3>
              <span className="text-xs font-semibold text-outline">
                {currentVocabItems.length} Ký Hiệu
              </span>
            </header>

            {currentVocabItems.length === 0 ? (
              <p className="text-xs text-outline py-4 text-center">Bài học này chưa có từ vựng nào.</p>
            ) : (
              <div className="space-y-3">
                {currentVocabItems.map(v => (
                  <div
                    key={v.id}
                    onClick={() => setActiveVocab(v)}
                    className={`p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition-all ${
                      activeVocab?.id === v.id
                        ? 'bg-primary-container/10 border-primary shadow-sm'
                        : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-surface-variant shrink-0 overflow-hidden relative border border-outline-variant/40">
                      <img className="w-full h-full object-cover" src={v.image} alt={v.name} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-label-bold text-sm text-on-surface truncate">{v.name}</h4>
                      <p className="text-xs text-on-surface-variant truncate">Tư thế {v.attribute}</p>
                    </div>

                    {activeVocab?.id === v.id && (
                      <span className="material-symbols-outlined text-primary text-xl">play_circle</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Mastery Bar */}
            <div className="pt-3 border-t border-outline-variant/20 space-y-1.5">
              <div className="flex justify-between items-center text-xs text-on-surface-variant">
                <span>Từ Vựng Đã Hoàn Thành</span>
                <span className="font-bold">{lesson.progress > 0 ? Math.ceil((lesson.progress / 100) * currentVocabItems.length) : 0} / {currentVocabItems.length}</span>
              </div>
              <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300" 
                  style={{ width: `${lesson.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

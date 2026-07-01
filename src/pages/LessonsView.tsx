import React, { useState } from 'react';
import { Lesson, LessonCategory } from '../types';
import { Sparkles, ArrowRight, Play, CheckCircle } from 'lucide-react';

interface LessonsViewProps {
  lessons: Lesson[];
  onSelectLesson: (lessonId: string) => void;
  onNavigateToTab: (tab: 'dashboard' | 'lessons' | 'practice' | 'profile' | 'admin') => void;
}

const CATEGORIES: { label: string; count: number; value: 'All' | LessonCategory }[] = [
  { label: 'All', count: 8, value: 'All' },
  { label: 'Alphabet', count: 2, value: 'Alphabet' },
  { label: 'Greetings', count: 2, value: 'Greetings' },
  { label: 'Numbers', count: 1, value: 'Numbers' },
  { label: 'Family', count: 1, value: 'Family' },
  { label: 'Food', count: 1, value: 'Food' },
  { label: 'Feelings', count: 1, value: 'Feelings' }
];

export default function LessonsView({ lessons, onSelectLesson, onNavigateToTab }: LessonsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | LessonCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);

  // Filter lessons
  const filteredLessons = lessons.filter(lesson => {
    const matchesCategory = selectedCategory === 'All' || lesson.category === selectedCategory;
    const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          lesson.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 2);
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      
      {/* Search & Intro */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-on-surface">Lesson Catalog</h2>
          <p className="text-body-md text-on-surface-variant">Start from the basics or explore advanced conversational modules.</p>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-80 group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary">
            search
          </span>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/60 rounded-xl focus:border-primary outline-none transition-all text-sm font-medium"
            placeholder="Search lessons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Category Horizontal Scrolling Tabs */}
      <section className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat.label}
            onClick={() => {
              setSelectedCategory(cat.value);
              setVisibleCount(6); // reset pagination when category changes
            }}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border shrink-0 flex items-center gap-1.5 ${
              selectedCategory === cat.value
                ? 'bg-primary text-on-primary border-primary shadow-sm'
                : 'bg-surface-container-lowest text-on-surface border-outline-variant/40 hover:bg-surface-container-low'
            }`}
          >
            {cat.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              selectedCategory === cat.value 
                ? 'bg-white/25 text-white' 
                : 'bg-surface-container-high text-on-surface-variant'
            }`}>
              {cat.count}
            </span>
          </button>
        ))}
      </section>

      {/* Lessons Responsive Grid */}
      {filteredLessons.length === 0 ? (
        <div className="py-16 text-center text-outline bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/60">
          <span className="material-symbols-outlined text-4xl mb-2">menu_book</span>
          <p className="font-semibold text-lg text-on-surface-variant mb-1">No lessons found</p>
          <p className="text-sm">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.slice(0, visibleCount).map((lesson, idx) => (
            <div 
              key={lesson.id}
              onClick={() => onSelectLesson(lesson.id)}
              className="cursor-pointer group flex flex-col justify-between bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden hover:elevation-2 transition-all"
            >
              <div>
                {/* Header Illustration */}
                <div className="h-44 bg-surface-variant relative overflow-hidden">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    src={lesson.image} 
                    alt={lesson.title} 
                  />
                  {/* Status Overlay */}
                  {lesson.progress === 100 ? (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                      <div className="px-4 py-2 bg-green-600 text-white rounded-full font-bold flex items-center gap-2 shadow-lg">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        100% Mastered
                      </div>
                    </div>
                  ) : lesson.progress > 0 ? (
                    <div className="absolute top-2 left-2 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                      {lesson.progress}% In Progress
                    </div>
                  ) : null}

                  {/* Level Badge */}
                  <div className="absolute top-2 right-2 px-3 py-1 bg-primary text-on-primary text-xs font-bold rounded-full shadow-sm">
                    {lesson.level}
                  </div>
                </div>

                {/* Info block */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6c70f5] bg-[#6c70f5]/10 px-2.5 py-0.5 rounded-full">
                      {lesson.category}
                    </span>
                    <span className="text-xs font-medium text-outline">Level {lesson.level === 'Beginner' ? '1' : '2'}</span>
                  </div>

                  <h3 className="font-headline-md text-xl font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                    {lesson.title}
                  </h3>
                  
                  <p className="text-body-md text-on-surface-variant text-sm line-clamp-2 leading-relaxed">
                    {lesson.description}
                  </p>
                </div>
              </div>

              {/* Detail block footer */}
              <div className="px-6 pb-6 pt-3 flex items-center justify-between border-t border-outline-variant/20">
                <div className="flex items-center space-x-3 text-xs text-outline font-semibold">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">schedule</span> {lesson.duration}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-amber-500">star</span> {lesson.rating}
                  </span>
                </div>
                <span className="material-symbols-outlined text-primary group-hover:translate-x-1.5 transition-transform">
                  arrow_forward
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {filteredLessons.length > visibleCount && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            className="active-scale rounded-xl px-12 py-3 border-2 border-outline/30 font-label-bold text-on-surface hover:border-primary hover:bg-surface-container-low transition-colors"
          >
            Load More Lessons
          </button>
        </div>
      )}

      {/* AI Practice Promo level up Banner */}
      <section className="mt-8">
        <div className="bg-gradient-to-r from-[#4648d4] to-[#2170e4] text-white p-8 rounded-3xl relative overflow-hidden elevation-2">
          {/* Back bubbles */}
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-white text-3xl">psychology</span>
                <span className="font-extrabold uppercase text-xs tracking-wider">AI Practice Lab</span>
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-extrabold text-white">Need personalized real-time calibration?</h3>
              <p className="opacity-90 text-sm max-w-xl">
                Open our interactive AI Practice Lab to activate details tracking and let the neural networks analyze your hand gestures instantly over the live video grid.
              </p>
            </div>
            <div className="md:col-span-4 flex justify-start md:justify-end">
              <button 
                onClick={() => onNavigateToTab('practice')}
                className="active-scale-lg px-6 py-3.5 bg-white text-primary font-bold rounded-xl shadow-lg hover:bg-slate-50 transition-all flex items-center gap-2 text-sm"
              >
                Launch Lab Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Search, Loader2, Sparkles, BookOpen, AlertCircle, PlusCircle } from 'lucide-react';
import { Lesson } from '../types';

interface LessonsCatalogProps {
  lessons: Lesson[];
  onStartLesson: (lesson: Lesson) => void;
  onNavigateToCreator: () => void;
}

export default function LessonsCatalog({ 
  lessons, 
  onStartLesson,
  onNavigateToCreator
}: LessonsCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Lessons');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(8); // Mock has 8 items, click load more to expand

  const categories = ['All Lessons', 'Alphabet', 'Numbers', 'Greetings', 'Food & Drink', 'Family'];

  // Filter & Search Logic
  const filteredLessons = useMemo(() => {
    return lessons.filter(lesson => {
      // Category matches
      const categoryMatch = 
        selectedCategory === 'All Lessons' || 
        lesson.category.toLowerCase() === selectedCategory.toLowerCase();

      // Search matches title or category or target
      const searchMatch = 
        searchQuery.trim() === '' || 
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.description.toLowerCase().includes(searchQuery.toLowerCase());

      return categoryMatch && searchMatch;
    });
  }, [lessons, selectedCategory, searchQuery]);

  // Paginated lessons
  const paginatedLessons = filteredLessons.slice(0, visibleCount);

  return (
    <div className="space-y-lg animate-fade-in">
      {/* Catalog Title Header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-md">
        <div>
          <h2 className="font-headline text-headline-lg font-bold text-on-surface">Lesson Catalog</h2>
          <p className="text-body-lg text-on-surface-variant font-medium mt-xs">
            Master American Sign Language at your own pace with interactive visual lessons.
          </p>
        </div>

        {/* Custom Quick Actions */}
        <button
          onClick={onNavigateToCreator}
          className="inline-flex items-center gap-sm bg-white border-2 border-primary text-primary hover:bg-surface-container-high py-2.5 px-5 rounded-xl font-bold text-sm transition-all active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>Add Custom Sign</span>
        </button>
      </header>

      {/* Category Filters & Desktop Search Bar */}
      <div className="flex flex-col md:flex-row gap-gutter md:items-center justify-between">
        {/* Category Filter Pills as precisely rendered in mock */}
        <section className="flex flex-wrap items-center gap-sm">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setVisibleCount(8); // reset pagination when category changes
                }}
                className={`px-lg py-1.5 rounded-full font-semibold text-sm transition-all active:scale-95 ${
                  isActive
                    ? 'bg-primary text-white font-bold shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </section>

        {/* Dynamic Search Box */}
        <div className="relative max-w-sm w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
            <Search className="w-4 h-4 text-outline" />
          </span>
          <input
            className="pl-10 pr-4 py-2 w-full bg-surface-container-low border-2 border-outline-variant rounded-full text-body-md focus:border-primary focus:ring-0 select-none outline-none transition-all placeholder:text-outline"
            placeholder="Search lessons..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid List */}
      {paginatedLessons.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-xl pt-md">
          {paginatedLessons.map((lesson) => {
            const progress = lesson.progress;
            const isMastered = progress === 100;
            const isInProgress = progress > 0 && progress < 100;
            
            return (
              <div 
                key={lesson.id} 
                onClick={() => onStartLesson(lesson)}
                className="bg-white rounded-xl overflow-hidden card-shadow flex flex-col group cursor-pointer border border-outline-variant/30"
              >
                {/* Aspect Video Card Image Container */}
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    alt={lesson.title} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]" 
                    referrerPolicy="no-referrer"
                    src={lesson.imageUrl}
                  />
                  {/* Status chips */}
                  {isMastered && (
                    <div className="absolute top-sm right-sm">
                      <span className="bg-surface/90 backdrop-blur-md px-sm py-1 rounded-full text-[11px] font-extrabold text-primary shadow-sm">
                        Mastered
                      </span>
                    </div>
                  )}
                  {isInProgress && (
                    <div className="absolute top-sm right-sm">
                      <span className="bg-secondary-container/90 backdrop-blur-md px-sm py-1 rounded-full text-[11px] font-extrabold text-white shadow-sm">
                        In Progress
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-lg flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-xs">
                      <span className="text-[11px] font-extrabold text-secondary uppercase tracking-tight">
                        {lesson.category}
                      </span>
                      <span className="text-[11px] font-semibold text-outline">
                        {lesson.difficulty}
                      </span>
                    </div>
                    
                    <h3 className="font-headline text-lg font-bold text-on-surface mb-2 leading-snug group-hover:text-primary transition-colors">
                      {lesson.title}
                    </h3>
                    
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed mb-6">
                      {lesson.description}
                    </p>
                  </div>

                  {/* Progress Indicators as specified in mockup */}
                  <div className="mt-auto">
                    <div className="flex justify-between items-center mb-1 text-[11px]">
                      <span className="font-semibold text-on-surface-variant">Progress</span>
                      <span className="font-extrabold text-primary">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-surface-container-low border border-dashed border-outline-variant rounded-2xl">
          <AlertCircle className="w-12 h-12 text-outline mx-auto stroke-1" />
          <h3 className="font-headline text-lg font-bold text-on-surface mt-sm">No lessons found</h3>
          <p className="text-body-md text-on-surface-variant mt-xs">
            Try adjusting your search criteria or explore another learning category!
          </p>
        </div>
      )}

      {/* Load More Pagination precisely styled like mockup */}
      {filteredLessons.length > visibleCount && (
        <div className="flex justify-center mt-2xl pt-lg">
          <button
            onClick={() => setVisibleCount((prev) => prev + 4)}
            className="px-8 py-3 aspect-auto border-2 border-primary text-primary font-bold rounded-xl hover:bg-surface-container-high transition-all active:scale-95 inline-flex items-center gap-sm shrink-0"
          >
            <span>Load More Lessons</span>
          </button>
        </div>
      )}
    </div>
  );
}

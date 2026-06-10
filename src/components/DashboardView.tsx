/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Sparkles, Flame, Clock, Award, Star, ArrowRight, CheckCircle, Brain, Play, TrendingUp
} from 'lucide-react';
import { Lesson, UserStats } from '../types';

interface DashboardViewProps {
  stats: UserStats;
  lessons: Lesson[];
  onNavigateToLessons: (category?: string) => void;
  onStartLesson: (lesson: Lesson) => void;
}

export default function DashboardView({ 
  stats, 
  lessons, 
  onNavigateToLessons, 
  onStartLesson 
}: DashboardViewProps) {
  // Find recommended lessons (uncompleted first, or first lesson)
  const recommendedLesson = lessons.find(l => l.progress > 0 && l.progress < 100) || lessons.find(l => l.progress === 0) || lessons[0];

  // Up to two other recommended ones
  const otherRecommendations = lessons
    .filter(l => l.id !== recommendedLesson?.id)
    .slice(0, 2);

  // Calculate dynamic circular progress based on actual data
  const totalLessons = lessons.length || 8;
  const completedCount = lessons.filter(l => l.progress === 100).length;
  const averageProgress = Math.round(lessons.reduce((acc, curr) => acc + curr.progress, 0) / totalLessons);
  const progressPercent = Math.min(100, Math.max(10, Math.round((completedCount / totalLessons) * 100)));

  // SVG Circular progress radius & stroke parameters
  const radius = 40;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Recent practice metrics
  const recentResults = [
    { title: 'ASL Letter "A"', time: 'Practiced 10 mins ago', accuracy: 94, status: 'Completed' },
    { title: 'ASL Phrase "Hello"', time: 'Practiced Yesterday', accuracy: 88, status: 'Mastered' },
    { title: 'ASL Number "3"', time: 'Practiced 2 days ago', accuracy: 100, status: 'Mastered' },
  ];

  return (
    <div className="space-y-lg animate-fade-in">
      {/* Premium Dashboard Greeting Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-md bg-white border border-outline-variant p-6 rounded-2xl">
        <div>
          <span className="font-mono text-xs font-bold text-primary uppercase tracking-widest bg-primary/5 px-2.5 py-1 rounded-full">
            STUDENT DASHBOARD
          </span>
          <h2 className="font-headline text-headline-lg text-on-surface mt-sm font-bold leading-tight">
            Hello, Learner!
          </h2>
          <p className="text-body-md text-on-surface-variant font-medium mt-1">
            Ready to master some new signs today? Your path to ASL fluency looks beautiful.
          </p>
        </div>
        <div className="flex items-center gap-sm bg-surface-container-low border border-outline-variant px-4 py-2.5 rounded-xl shrink-0">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-xs font-mono font-bold text-on-surface">XP Target Goal: 200/Day</span>
        </div>
      </header>

      {/* Primary Workspace: Main content is Col span 2, widgets sidebar is Col span 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        
        {/* LEFT COLUMN: Circular tracker and course recommendations */}
        <div className="lg:col-span-2 space-y-lg">
          
          {/* Circular Learning Progress Card */}
          <div className="bg-white border border-outline-variant rounded-2xl p-lg flex flex-col md:flex-row items-center gap-lg">
            
            {/* SVG Interactive Circular Gauge Widget */}
            <div className="relative shrink-0 w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="56" 
                  cy="56" 
                  r={radius} 
                  className="stroke-surface-container-high fill-transparent"
                  strokeWidth={strokeWidth} 
                />
                <circle 
                  cx="56" 
                  cy="56" 
                  r={radius} 
                  className="stroke-primary fill-transparent transition-all duration-1000 ease-out" 
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black font-headline text-on-surface">{progressPercent}%</span>
                <span className="text-[9px] font-mono font-bold text-outline uppercase tracking-wider">Mastered</span>
              </div>
            </div>

            {/* Explanation & Action column */}
            <div className="flex-1 space-y-xs text-center md:text-left">
              <h3 className="text-lg font-bold font-headline text-on-surface leading-snug">
                Learning Progress
              </h3>
              <p className="text-body-md text-on-surface-variant font-medium">
                You're making great progress! Finish {Math.max(1, 3 - completedCount)} more lessons to unlock the Advanced Handshapes module.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-md mt-lg pt-sm">
                <button
                  type="button"
                  onClick={() => recommendedLesson && onStartLesson(recommendedLesson)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-sm bg-primary text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all hover:bg-primary-container hover:scale-[1.02] active:scale-95 shadow-md"
                >
                  <Play className="w-4 h-4 fill-white shrink-0" />
                  <span>Continue Learning</span>
                </button>
                <div className="text-xs text-outline font-semibold">
                  Course average: <span className="text-primary font-bold">{averageProgress}% completed</span>
                </div>
              </div>
            </div>

          </div>

          {/* Recommended for You List */}
          <div className="bg-white border border-outline-variant p-lg rounded-2xl space-y-md">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-headline text-on-surface flex items-center gap-sm">
                <Brain className="w-5 h-5 text-primary" />
                <span>Recommended for You</span>
              </h3>
              <button 
                type="button"
                onClick={() => onNavigateToLessons()}
                className="text-xs font-bold text-primary flex items-center gap-xs hover:underline"
              >
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md pt-sm">
              {lessons.slice(0, 2).map((lesson) => (
                <div 
                  key={lesson.id}
                  onClick={() => onStartLesson(lesson)}
                  className="bg-surface-container-low border border-outline-variant/60 rounded-xl overflow-hidden cursor-pointer flex flex-col group hover:scale-[1.01] hover:border-primary/50 transition-all"
                >
                  <div className="relative aspect-video w-full overflow-hidden shrink-0">
                    <img 
                      alt={lesson.title} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                      referrerPolicy="no-referrer"
                      src={lesson.imageUrl}
                    />
                    <div className="absolute top-sm left-sm bg-surface/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-secondary-container">
                      {lesson.category}
                    </div>
                  </div>
                  <div className="p-md flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                        {lesson.title}
                      </h4>
                      <p className="text-xs text-on-surface-variant font-medium line-clamp-2 mt-1 leading-relaxed">
                        {lesson.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold text-outline mt-sm pt-xs border-t border-outline-variant/30">
                      <span>{lesson.difficulty}</span>
                      <span className="text-primary font-bold">{lesson.progress}% completed</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Streak widget, XP, performance history */}
        <div className="space-y-lg">
          
          {/* Daily Streak Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 to-indigo-950 p-lg text-white shadow-xl flex flex-col justify-between h-52">
            
            {/* Animated Flare Overlay */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-16 h-16 bg-primary/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider font-mono">
                Daily Streak
              </div>
              <div className="relative flex items-center justify-center">
                <Flame className="w-10 h-10 text-orange-500 fill-orange-500 stroke-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse" />
              </div>
            </div>

            <div>
              <h3 className="text-3xl font-black font-headline text-white mt-xs">
                {stats.streakDays} Days
              </h3>
              <p className="text-xs text-white/80 font-medium leading-relaxed mt-1">
                Keep it up! Reach 7 days for a profile badge and bonus multipliers.
              </p>
            </div>

            {/* Streak Progress Gauge out of 7 days */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-white/60">
                <span>GOAL: 7 DAYS</span>
                <span>{stats.streakDays}/7 completed</span>
              </div>
              <div className="bg-white/20 rounded-full h-1.5 w-full overflow-hidden">
                <div 
                  className="bg-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (stats.streakDays / 7) * 100)}%` }}
                />
              </div>
            </div>

          </div>

          {/* Level Board */}
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-lg flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-extrabold font-mono text-outline uppercase tracking-wider mb-sm flex items-center gap-sm">
                <Award className="text-primary w-4 h-4 stroke-[2.5]" />
                <span>Level Tracker</span>
              </h3>
              <div className="flex items-center gap-md my-sm">
                <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center text-white text-xl font-black font-headline shadow-inner">
                  {stats.level}
                </div>
                <div>
                  <p className="font-bold text-on-surface leading-tight">Level {stats.level} Novice</p>
                  <p className="text-xs text-on-surface-variant font-medium">Earn {200 - (stats.xp % 200)} more XP for level {stats.level + 1}</p>
                </div>
              </div>
              
              <div className="space-y-1.5 mt-md">
                <div className="flex justify-between text-[11px] font-mono font-bold text-on-surface-variant">
                  <span>XP: {stats.xp % 200}/200</span>
                  <span className="text-primary">{Math.round(((stats.xp % 200) / 200) * 100)}%</span>
                </div>
                <div className="bg-surface-container-high rounded-full h-2 w-full overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${((stats.xp % 200) / 200) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Performance Details */}
          <div className="bg-white border border-outline-variant p-lg rounded-2xl space-y-md">
            <h3 className="text-sm font-extrabold font-mono text-outline uppercase tracking-wider flex items-center gap-xs">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Recent Results</span>
            </h3>
            
            <div className="space-y-sm">
              {recentResults.map((result, i) => (
                <div key={i} className="flex flex-col gap-1.5 bg-surface-container-low border border-outline-variant/40 rounded-xl p-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">
                        {result.title}
                      </h4>
                      <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
                        {result.time}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                      {result.accuracy}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${result.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button 
              type="button" 
              onClick={() => onNavigateToLessons()}
              className="w-full text-center py-2 border-2 border-dashed border-outline-variant hover:border-primary/50 text-xs font-bold text-on-surface-variant hover:text-primary transition-all rounded-xl"
            >
              View Performance History
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

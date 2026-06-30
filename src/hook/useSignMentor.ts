import { useState, useEffect } from 'react';
import { Lesson, UserStats, INITIAL_LESSONS, INITIAL_ACHIEVEMENTS } from '../types';

export function useSignMentor() {
  const [lessons, setLessons] = useState<Lesson[]>(() => {
    const saved = localStorage.getItem('signmentor_lessons_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_LESSONS;
  });

  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('signmentor_stats_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      xp: 450,
      level: 2,
      lessonsCompleted: INITIAL_LESSONS.filter(l => l.progress === 100).length,
      practiceTimeMinutes: 120,
      streakDays: 4,
      achievements: INITIAL_ACHIEVEMENTS
    };
  });

  useEffect(() => {
    localStorage.setItem('signmentor_lessons_v1', JSON.stringify(lessons));
  }, [lessons]);

  useEffect(() => {
    localStorage.setItem('signmentor_stats_v1', JSON.stringify(stats));
  }, [stats]);

  const handleUpdateProgress = (lessonId: string, progress: number, xpGained: number) => {
    setLessons(prev => prev.map(l => {
      if (l.id === lessonId) {
        return { 
          ...l, 
          progress, 
          status: progress === 100 ? 'Mastered' : progress > 0 ? 'In Progress' : 'Not Started'
        };
      }
      return l;
    }));

    if (xpGained > 0) {
      handleGrantXP(xpGained, false);
    }
  };

  const handleGrantXP = (xpAmount: number, isAIClaim: boolean = false) => {
    setStats(prev => {
      const newXp = prev.xp + xpAmount;
      const calculatedLevel = Math.floor(newXp / 200) + 1; 
      
      const updatedAchievements = prev.achievements.map(ach => {
        if (ach.id === 'first_step' && !ach.unlockedAt) {
          return { ...ach, unlockedAt: new Date().toLocaleDateString() };
        }
        if (ach.id === 'ai_pioneer' && isAIClaim && !ach.unlockedAt) {
          return { ...ach, unlockedAt: new Date().toLocaleDateString() };
        }
        return ach;
      });

      return {
        ...prev,
        xp: newXp,
        level: Math.max(prev.level, calculatedLevel),
        lessonsCompleted: lessons.filter(l => l.progress === 100).length,
        practiceTimeMinutes: prev.practiceTimeMinutes + Math.floor(Math.random() * 5) + 5,
        achievements: updatedAchievements
      };
    });
  };

  const handleAddCustomLesson = (newLesson: Lesson) => {
    setLessons(prev => [newLesson, ...prev]);
  };

  const handleDeleteLesson = (lessonId: string) => {
    setLessons(prev => prev.filter(l => l.id !== lessonId));
  };

  return {
    lessons,
    stats,
    handleUpdateProgress,
    handleGrantXP,
    handleAddCustomLesson,
    handleDeleteLesson,
    setStats
  };
}
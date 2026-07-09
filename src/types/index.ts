export interface User {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Idle';
  proficiency: number; // percentage value
  lastActive: string;
  avatar: string;
  username?: string; // only populated for admin-listed users
  role?: 'USER' | 'ADMIN'; // only populated for admin-listed users
}

export interface UserStats {
  xp: number;
  level: number;
  lessonsCompleted: number;
  practiceTimeMinutes: number;
  streakDays: number;
  achievements: Achievement[];
}

export interface Lesson {
  id: string;
  title: string;
  category: string; // real category name from the backend (Category.name), not a fixed enum
  level: 'Beginner' | 'Intermediate';
  progress: number;
  status: 'Mastered' | 'In Progress' | 'Not Started';
  image: string;
  description: string;
  breadcrumbs?: string[];
  tips?: string;
  mistakes?: string;
  vocabulary: string[]; // references of vocab IDs
  steps?: any[];
  quizQuestions?: any[];
  letterTarget?: string;
  imageUrl?: string;
  signGuide?: string;
  difficulty?: string;
}

export type QuizQuestion = any;

export interface Vocabulary {
  id: string;
  name: string;
  category: string;
  attribute: string;
  image: string;
  description: string;
  videoUrl?: string;
  expectedId: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  secured: boolean;
  // Progress towards unlocking, e.g. 2/10. Undefined when BE gave no stats to derive it from.
  progressCurrent?: number;
  progressTarget?: number;
  progressUnit?: string;
}

export interface RecentResult {
  id: string;
  sign: string;
  accuracy: number;
  icon: 'front_hand' | 'back_hand' | 'waving_hand';
  statusText: string;
  timeAgo: string;
}

export interface PracticeSessionState {
  lessonId: string;
  currentScore: number;
  handShapeGrade: 'Excellent' | 'Good' | 'Fair' | 'Adjust Pose';
  handShapeScore: number;
  orientationGrade: 'Excellent' | 'Good' | 'Fair' | 'Adjust Pose';
  orientationScore: number;
  motionGrade: 'Excellent' | 'Good' | 'Fair' | 'Adjust Pose';
  motionScore: number;
  status: 'detecting' | 'analyzed' | 'mastered';
}

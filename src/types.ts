export interface User {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Idle';
  proficiency: number; // percentage value
  lastActive: string;
  avatar: string;
}

export type LessonCategory = 'Alphabet' | 'Greetings' | 'Numbers' | 'Family' | 'Food' | 'Feelings';

export interface Lesson {
  id: string;
  title: string;
  category: LessonCategory;
  level: 'Beginner' | 'Intermediate';
  progress: number;
  status: 'Mastered' | 'In Progress' | 'Not Started';
  image: string;
  description: string;
  duration: string;
  rating: number;
  breadcrumbs: string[];
  tips?: string;
  mistakes?: string;
  vocabulary: string[]; // references of vocab IDs
}

export interface Vocabulary {
  id: string;
  name: string;
  category: string;
  attribute: string;
  image: string;
  description: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  secured: boolean;
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

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  subjectId: string;
  text: string;
  options: Option[];
  correctOptionId: string;
  explanation: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
}

export interface QuestionProgress {
  questionId: string;
  lastReviewedAt: number; // timestamp
  nextReviewAt: number; // timestamp
  interval: number; // days
  efactor: number; // easiness factor
  isWeakness: boolean;
  correctCount: number;
  incorrectCount: number;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  questionsAnswered: number;
  correctAnswers: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  unlockedAt: number | null; // timestamp
  iconType: string;
}

export interface UserData {
  progress: Record<string, QuestionProgress>;
  dailyLogs: Record<string, DailyLog>;
  badges: Badge[];
  lastMissionDate: string;
  missions: Mission[];
  currentStreak: number;
  lastStudyDate: string | null;
  customQuestions: Question[];
}

export interface Mission {
  id: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  type: 'answer_count' | 'correct_count' | 'review_weakness';
}

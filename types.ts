
export enum GameMode {
  CLASSIC = 'CLASSIC',
  TIMED = 'TIMED',
  CATEGORY = 'CATEGORY',
  SURVIVAL = 'SURVIVAL',
  ACADEMIC = 'ACADEMIC',
  UME = 'UME',
  SSCE = 'SSCE',
  GCE = 'GCE',
  NECO = 'NECO',
  JSSCE = 'JSSCE',
  MULTIPLAYER = 'MULTIPLAYER',
  REVELATIONS = 'REVELATIONS'
}

export type Category = 
  | 'Mathematics'
  | 'English'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'Geography'
  | 'Basic Science'
  | 'Nigerian History'
  | 'Global Current Affairs'
  | 'Nigerian Current Affairs'
  | 'General Knowledge'
  | 'Science & Nature'
  | 'History'
  | 'Geography (General)'
  | 'Revelations';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // Index 0-3
  explanation: string;
  difficulty: number; // 1-36
  category: Category;
}

export interface User {
  id: string;
  username: string;
  email: string;
  royaltyPoints: number;
  highestScore: number;
  longestStreak: number;
  favoriteCategory: Category;
  avatar: string;
  playCount: Record<string, number>;
  role?: 'player' | 'admin';
  createdAt?: any;
}

export interface GameState {
  currentQuestionIndex: number;
  score: number;
  correctCount: number;
  incorrectCount: number;
  isGameOver: boolean;
  isWon: boolean;
  timeLeft?: number;
  questions: Question[];
  streak: number;
  maxStreak: number;
  selectedOption: number | null;
  showFeedback: boolean;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  royaltyPoints: number;
  highestScore: number;
  avatar: string;
}

export interface MultiplayerPlayer {
  id: string;
  username: string;
  avatar: string;
  score: number;
  isReady: boolean;
  lastAnswerCorrect?: boolean;
}

export interface MultiplayerRoom {
  id: string;
  players: MultiplayerPlayer[];
  status: 'waiting' | 'starting' | 'playing' | 'finished';
  questions: Question[];
  currentQuestionIndex: number;
  timer: number;
  category: Category;
}

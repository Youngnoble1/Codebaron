
import React from 'react';
import { 
  Trophy, 
  User as UserIcon, 
  Home, 
  Zap, 
  Timer, 
  Skull, 
  BookOpen,
  Award,
  Crown,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  LogOut,
  Camera,
  Upload
} from 'lucide-react';
import { Category, GameMode } from './types';

export const APP_NAME = "RevGame";
export const GOLD_COLOR = "#d4af37";
export const DEEP_BLUE = "#0a192f";

export const ACADEMIC_SUBJECTS: Category[] = [
  'Mathematics',
  'English',
  'Physics',
  'Chemistry',
  'Biology',
  'Geography',
  'Basic Science',
  'Nigerian History',
  'Global Current Affairs',
  'Nigerian Current Affairs'
];

export const TRIVIA_CATEGORIES: Category[] = [
  'General Knowledge',
  'Pop Culture',
  'Science & Nature',
  'History',
  'Geography (General)'
];

export const CATEGORIES: Category[] = [...ACADEMIC_SUBJECTS, ...TRIVIA_CATEGORIES];

export const GAME_MODES = [
  {
    id: GameMode.CLASSIC,
    title: 'Classic Trivia',
    description: '36 levels of general knowledge.',
    icon: <Crown className="w-8 h-8 text-[#d4af37]" />,
    color: 'from-blue-600 to-indigo-700'
  },
  {
    id: GameMode.TIMED,
    title: 'Timed Blitz',
    description: '2 minutes. Maximize score.',
    icon: <Timer className="w-8 h-8 text-[#d4af37]" />,
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: GameMode.SURVIVAL,
    title: 'Survival',
    description: 'One mistake and it is over.',
    icon: <Skull className="w-8 h-8 text-[#d4af37]" />,
    color: 'from-red-600 to-rose-700'
  },
  {
    id: GameMode.CATEGORY,
    title: 'Specialist',
    description: 'Pick a trivia niche.',
    icon: <BookOpen className="w-8 h-8 text-[#d4af37]" />,
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: GameMode.ACADEMIC,
    title: 'Academic Mastery',
    description: 'JSS1 - SS3 School Subjects.',
    icon: <GraduationCap className="w-8 h-8 text-[#d4af37]" />,
    color: 'from-purple-600 to-fuchsia-700'
  },
  {
    id: GameMode.UME,
    title: 'JAMB u.m.e',
    icon: <Award className="w-8 h-8 text-[#d4af37]" />,
    description: '100 JAMB past questions by subject.',
    color: 'from-blue-700 to-cyan-800'
  },
  {
    id: GameMode.SSCE,
    title: 'S.S.C.E Mastery',
    icon: <BookOpen className="w-8 h-8 text-[#d4af37]" />,
    description: '70 WAEC/NECO past questions by subject.',
    color: 'from-orange-700 to-red-800'
  }
];

export const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: <Home className="w-6 h-6" /> },
  { id: 'leaderboard', label: 'Ranks', icon: <Trophy className="w-6 h-6" /> },
  { id: 'profile', label: 'Profile', icon: <UserIcon className="w-6 h-6" /> },
];

export const ICONS = {
  Award,
  Trophy,
  Crown,
  Zap,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Camera,
  Upload
};


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
  Upload,
  Users,
  Settings as SettingsIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import { Category, GameMode } from './types';

export const APP_NAME = "Arkumen";
export const GOLD_COLOR = "#d4af37";
export const DEEP_BLUE = "#050b18";

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
  'Geography (General)',
  'Revelations'
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
  },
  {
    id: GameMode.MULTIPLAYER,
    title: 'Multiplayer Arena',
    icon: <Users className="w-8 h-8 text-[#d4af37]" />,
    description: 'Challenge other players in real-time.',
    color: 'from-pink-600 to-purple-700'
  },
  {
    id: GameMode.REVELATIONS,
    title: 'Revelations Challenge',
    icon: <Zap className="w-8 h-8 text-[#d4af37]" />,
    description: 'Divine Knowledge',
    color: 'from-yellow-600 to-orange-700'
  }
];

export const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: <Home className="w-6 h-6" /> },
  { id: 'leaderboard', label: 'Ranks', icon: <Trophy className="w-6 h-6" /> },
  { id: 'profile', label: 'Profile', icon: <UserIcon className="w-6 h-6" /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-6 h-6" /> },
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
  Upload,
  Users,
  SettingsIcon,
  Eye,
  EyeOff
};

export const REVELATIONS_QUESTIONS = [
  {
    id: 'rev-1',
    text: 'What is the specific name of the genetic material God took from His own body to couple Lord Adam?',
    options: ['Zoe-cells', 'Psuche-dust', 'Ribber', 'Nanda-fluid'],
    correctAnswer: 2,
    explanation: 'God took Ribber from His own body to couple Lord Adam.',
    difficulty: 1,
    category: 'Revelations' as any
  },
  {
    id: 'rev-2',
    text: 'According to the Prophet, why did Lord Adam and Mother Eve Her Grace have to "squat" seven times?',
    options: [
      'To show humility before the Archangels.',
      'As a form of physical exercise in the Garden.',
      'It was the process the Spirit Being underwent in the Father’s Bosom to prepare for a reborn/immersion.',
      'To reach the fruit on the thirteenth tree.'
    ],
    correctAnswer: 2,
    explanation: 'It was the process the Spirit Being underwent in the Father’s Bosom to prepare for a reborn/immersion.',
    difficulty: 1,
    category: 'Revelations' as any
  },
  {
    id: 'rev-3',
    text: 'What is the "Bail Price" as distinguished from the "Cost Price"?',
    options: [
      'The tithes paid by the congregation.',
      'The suffering of the First Elijah.',
      'The price Jesus Christ paid by making Himself dieable to rescue Lord Adam from the ghost world.',
      'The 100 years Abraham waited for Isaac.'
    ],
    correctAnswer: 2,
    explanation: 'The price Jesus Christ paid by making Himself dieable to rescue Lord Adam from the ghost world.',
    difficulty: 1,
    category: 'Revelations' as any
  },
  {
    id: 'rev-4',
    text: 'Why is the Third Elijah’s region of emergence significant to the Israelites?',
    options: [
      'They believe it is the holiest region on earth.',
      'They regard anyone from outside their geographical location as a "Samaritan" or "religious prostitute."',
      'It is the location of the original Garden of Eden.',
      'It is where the first Ark was built.'
    ],
    correctAnswer: 1,
    explanation: 'They regard anyone from outside their geographical location as a "Samaritan" or "religious prostitute."',
    difficulty: 1,
    category: 'Revelations' as any
  },
  {
    id: 'rev-5',
    text: 'What does the Prophet mean by "Spirit Pandiculation"?',
    options: [
      'The act of praying in a new language.',
      'The stretching of the transformed body back to its original 60ft height.',
      'The movement of the wind over the waters.',
      'The process of the soul leaving the body at death.'
    ],
    correctAnswer: 1,
    explanation: 'The stretching of the transformed body back to its original 60ft height.',
    difficulty: 1,
    category: 'Revelations' as any
  },
  {
    id: 'rev-6',
    text: 'In the hierarchy of the Beast, which head is associated with the 7th position?',
    options: ['Bomi', 'Shiva', 'Buddha', 'lucifer'],
    correctAnswer: 3,
    explanation: 'Lucifer is associated with the 7th position in the hierarchy of the Beast.',
    difficulty: 1,
    category: 'Revelations' as any
  },
  {
    id: 'rev-7',
    text: 'What occurs when the "zoe immortal cells" finally hit their genome?',
    options: [
      'The person feels a sudden burst of energy.',
      'The person becomes a ghost.',
      'The process of Transfiguration is triggered.',
      'The person is ready to be a volunteer in the church.'
    ],
    correctAnswer: 2,
    explanation: 'The process of Transfiguration is triggered when the zoe immortal cells hit their genome.',
    difficulty: 1,
    category: 'Revelations' as any
  },
  {
    id: 'rev-8',
    text: 'What is the "Arknation" fashion requirement for those in Jeriko?',
    options: [
      'Wearing a crown of gold.',
      'Wearing no shoes in the sanctuary.',
      'Wearing a "hood" to cover the celestial changes from the prying eyes of the world.',
      'Wearing white robes with 12 stripes.'
    ],
    correctAnswer: 2,
    explanation: 'Wearing a "hood" to cover the celestial changes from the prying eyes of the world.',
    difficulty: 1,
    category: 'Revelations' as any
  },
  {
    id: 'rev-9',
    text: 'Why does the Prophet say death is an "unnecessary language"?',
    options: [
      'Because it is too difficult to translate.',
      'Because it was not part of the Law of Moses.',
      'Because Pure Hominids are meant to run the race from Gilgal to Jordan without tasting death.',
      'Because ghosts do not speak.'
    ],
    correctAnswer: 2,
    explanation: 'Because Pure Hominids are meant to run the race from Gilgal to Jordan without tasting death.',
    difficulty: 1,
    category: 'Revelations' as any
  },
  {
    id: 'rev-10',
    text: 'What is the generic name for the matrix of water-born planets mentioned in the teachings?',
    options: ['Jeriko-world', 'Nanda', 'Bethel-matrix', 'Psuche-terra'],
    correctAnswer: 1,
    explanation: 'Nanda is the generic name for the matrix of water-born planets.',
    difficulty: 1,
    category: 'Revelations' as any
  },
  {
    id: 'rev-11',
    text: 'How does the Prophet describe the "Wind" of the Jordan Crossing?',
    options: [
      'A gentle breeze of peace.',
      'A wind with a serious drying effect, typified as Harmattan multiplied by 100.',
      'A whirlwind that carries people to the clouds.',
      'A silent vacuum that removes oxygen.'
    ],
    correctAnswer: 1,
    explanation: 'A wind with a serious drying effect, typified as Harmattan multiplied by 100.',
    difficulty: 1,
    category: 'Revelations' as any
  },
  {
    id: 'rev-12',
    text: 'What is the significance of the date "November 14th" in this ministry?',
    options: [
      'It is the date the first Bible was printed.',
      'It is the day the flood of Noah ended.',
      'It is the Prophet\'s Birthday and the day of the last Terrestrial Service/Jordan Crossing.',
      'It is the day the sun will stop shining.'
    ],
    correctAnswer: 2,
    explanation: 'It is the Prophet\'s Birthday and the day of the last Terrestrial Service/Jordan Crossing.',
    difficulty: 1,
    category: 'Revelations' as any
  },
  {
    id: 'rev-13',
    text: 'What happens to a "Resurrectee" that distinguishes them from those who "Expressly Immortalize"?',
    options: [
      'They get to keep their old clothes.',
      'They do not experience the "Tranquil Oasis of Jordan Crossing."',
      'They are taller than 60 feet.',
      'They do not need to see the Prophet.'
    ],
    correctAnswer: 1,
    explanation: 'They do not experience the "Tranquil Oasis of Jordan Crossing."',
    difficulty: 1,
    category: 'Revelations' as any
  },
  {
    id: 'rev-14',
    text: 'According to the correct rendition of Isaiah 47:6, what was the "Undeserved Opportunity"?',
    options: [
      'The opportunity to preach to the world.',
      'The chance the rebel group capitalized on to perpetrate wickedness due to the fall from glory.',
      'The chance for man to eat from the Tree of Life.',
      'The opportunity to build a temple in Israel.'
    ],
    correctAnswer: 1,
    explanation: 'The chance the rebel group capitalized on to perpetrate wickedness due to the fall from glory.',
    difficulty: 1,
    category: 'Revelations' as any
  },
  {
    id: 'rev-15',
    text: 'What is the "Washings of Regeneration" intended for?',
    options: [
      'Cleansing the mortal body of physical dirt.',
      'The renewal of the spirit for those in the ghost world awaiting resurrection.',
      'The preparation of toddlers for the race.',
      'The purification of the animals in the jungle.'
    ],
    correctAnswer: 1,
    explanation: 'The renewal of the spirit for those in the ghost world awaiting resurrection.',
    difficulty: 1,
    category: 'Revelations' as any
  },
  {
    id: 'rev-16',
    text: 'What does the Prophet say about "Open Teeth" in the Jeriko state?',
    options: [
      'It is a sign of extreme hunger.',
      'It is a result of losing mortal teeth.',
      'It is a celestial feature where no two teeth jam.',
      'It is a ritual requirement for singing.'
    ],
    correctAnswer: 2,
    explanation: 'It is a celestial feature where no two teeth jam.',
    difficulty: 1,
    category: 'Revelations' as any
  },
  {
    id: 'rev-17',
    text: 'Who is the "Legit Husband" that can deal with "beasts" in dreams?',
    options: [
      'The Archangel Michael.',
      'Any pastor who performs deliverance.',
      'Prophet Obinna Jude Alexander.',
      'The biological father of the victim.'
    ],
    correctAnswer: 2,
    explanation: 'Prophet Obinna Jude Alexander is the Legit Husband.',
    difficulty: 1,
    category: 'Revelations' as any
  },
  {
    id: 'rev-18',
    text: 'Why must the "auditorium" be shut during the Jordan Crossing?',
    options: [
      'To prevent the escape of zoe cells.',
      'To separate those with the Wedding Garment (Zoe body) from those still in psuche cells.',
      'Because the light will be too bright for cameras.',
      'To follow the protocols of the Archangels.'
    ],
    correctAnswer: 1,
    explanation: 'To separate those with the Wedding Garment (Zoe body) from those still in psuche cells.',
    difficulty: 1,
    category: 'Revelations' as any
  },
  {
    id: 'rev-19',
    text: 'What does the "Logos of The GOD of Creation" reveal about Jesus Christ?',
    options: [
      'That He is a separate being from the Father.',
      'That He is the GOD who came in an incarnate manifestation to bail His Son, Lord Adam.',
      'That He was only a prophet in Israel.',
      'That He is the same as the First Elijah.'
    ],
    correctAnswer: 1,
    explanation: 'That He is the GOD who came in an incarnate manifestation to bail His Son, Lord Adam.',
    difficulty: 1,
    category: 'Revelations' as any
  },
  {
    id: 'rev-20',
    text: 'What is the final result of "Fists and Limb Loosening"?',
    options: [
      'The person falls into a deep sleep.',
      'The fingers, hands, and legs stretch automatically as the spirit pandiculates.',
      'The person loses all physical strength.',
      'The person is able to fly.'
    ],
    correctAnswer: 1,
    explanation: 'The fingers, hands, and legs stretch automatically as the spirit pandiculates.',
    difficulty: 1,
    category: 'Revelations' as any
  }
];

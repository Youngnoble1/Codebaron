
import { Question } from "../types";

export const FALLBACK_QUESTIONS: Question[] = [
  {
    id: 'f1',
    text: 'What is the capital of Nigeria?',
    options: ['Lagos', 'Abuja', 'Kano', 'Ibadan'],
    correctAnswer: 1,
    explanation: 'Abuja is the capital city of Nigeria, located in the center of the country.',
    category: 'General Knowledge',
    difficulty: 1
  },
  {
    id: 'f2',
    text: 'Which of these is a primary color?',
    options: ['Green', 'Orange', 'Red', 'Purple'],
    correctAnswer: 2,
    explanation: 'Red, Blue, and Yellow are the primary colors.',
    category: 'General Knowledge',
    difficulty: 1
  },
  {
    id: 'f3',
    text: 'What is 15 + 27?',
    options: ['32', '42', '52', '45'],
    correctAnswer: 1,
    explanation: '15 + 27 = 42.',
    category: 'Mathematics',
    difficulty: 1
  },
  {
    id: 'f4',
    text: 'Who is known as the "Father of Nigerian Nationalism"?',
    options: ['Nnamdi Azikiwe', 'Herbert Macaulay', 'Obafemi Awolowo', 'Ahmadu Bello'],
    correctAnswer: 1,
    explanation: 'Herbert Macaulay is often referred to as the Father of Nigerian Nationalism.',
    category: 'Nigerian History',
    difficulty: 2
  },
  {
    id: 'f5',
    text: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 1,
    explanation: 'Mars is called the Red Planet because of iron oxide on its surface.',
    category: 'Science & Nature',
    difficulty: 1
  },
  {
    id: 'f6',
    text: 'What is the largest ocean on Earth?',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
    correctAnswer: 3,
    explanation: 'The Pacific Ocean is the largest and deepest of Earth\'s oceanic divisions.',
    category: 'Geography (General)',
    difficulty: 1
  },
  {
    id: 'f7',
    text: 'Which Nigerian state is known as the "Land of Virtue"?',
    options: ['Oyo', 'Osun', 'Ekiti', 'Ondo'],
    correctAnswer: 1,
    explanation: 'Osun State is known as the Land of Virtue.',
    category: 'Nigerian History',
    difficulty: 2
  },
  {
    id: 'f8',
    text: 'What is the chemical symbol for Gold?',
    options: ['Ag', 'Fe', 'Au', 'Pb'],
    correctAnswer: 2,
    explanation: 'Au is the chemical symbol for Gold, from the Latin word "Aurum".',
    category: 'Chemistry',
    difficulty: 2
  }
];

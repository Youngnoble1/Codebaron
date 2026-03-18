
import { Question } from "../types";

export const QUESTION_BANK: Record<string, Question[]> = {
  'Mathematics': [
    {
      id: 'm1',
      text: 'What is the value of x in the equation 2x + 5 = 15?',
      options: ['5', '10', '7.5', '20'],
      correctAnswer: 0,
      explanation: '2x = 15 - 5 => 2x = 10 => x = 5.',
      category: 'Mathematics',
      difficulty: 1
    },
    {
      id: 'm2',
      text: 'What is the square root of 144?',
      options: ['10', '11', '12', '14'],
      correctAnswer: 2,
      explanation: '12 * 12 = 144.',
      category: 'Mathematics',
      difficulty: 1
    },
    {
      id: 'm3',
      text: 'What is the area of a rectangle with length 8cm and width 5cm?',
      options: ['13cm²', '40cm²', '26cm²', '30cm²'],
      correctAnswer: 1,
      explanation: 'Area = Length * Width = 8 * 5 = 40.',
      category: 'Mathematics',
      difficulty: 1
    },
    {
      id: 'm4',
      text: 'If a triangle has angles 60° and 40°, what is the third angle?',
      options: ['80°', '100°', '90°', '70°'],
      correctAnswer: 0,
      explanation: 'Sum of angles in a triangle is 180°. 180 - (60 + 40) = 80.',
      category: 'Mathematics',
      difficulty: 2
    },
    {
      id: 'm5',
      text: 'What is the value of π (pi) to two decimal places?',
      options: ['3.12', '3.14', '3.16', '3.18'],
      correctAnswer: 1,
      explanation: 'Pi is approximately 3.14159...',
      category: 'Mathematics',
      difficulty: 1
    }
  ],
  'English': [
    {
      id: 'e1',
      text: 'Which of these is a noun?',
      options: ['Quickly', 'Beautiful', 'Happiness', 'Run'],
      correctAnswer: 2,
      explanation: 'Happiness is an abstract noun.',
      category: 'English',
      difficulty: 1
    },
    {
      id: 'e2',
      text: 'What is the plural of "Child"?',
      options: ['Childs', 'Children', 'Childrens', 'Childes'],
      correctAnswer: 1,
      explanation: 'The plural of child is children.',
      category: 'English',
      difficulty: 1
    },
    {
      id: 'e3',
      text: 'Which word is a synonym for "Happy"?',
      options: ['Sad', 'Angry', 'Joyful', 'Tired'],
      correctAnswer: 2,
      explanation: 'Joyful means the same as happy.',
      category: 'English',
      difficulty: 1
    },
    {
      id: 'e4',
      text: 'Identify the verb in: "The cat sat on the mat."',
      options: ['Cat', 'Sat', 'Mat', 'The'],
      correctAnswer: 1,
      explanation: 'Sat is the action word (verb).',
      category: 'English',
      difficulty: 1
    }
  ],
  'Physics': [
    {
      id: 'p1',
      text: 'What is the unit of Force?',
      options: ['Joule', 'Watt', 'Newton', 'Pascal'],
      correctAnswer: 2,
      explanation: 'Force is measured in Newtons (N).',
      category: 'Physics',
      difficulty: 1
    },
    {
      id: 'p2',
      text: 'What is the speed of light in a vacuum?',
      options: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '1,000,000 km/s'],
      correctAnswer: 0,
      explanation: 'The speed of light is approximately 300,000 kilometers per second.',
      category: 'Physics',
      difficulty: 2
    },
    {
      id: 'p3',
      text: 'Which law states that for every action, there is an equal and opposite reaction?',
      options: ['Newton\'s First Law', 'Newton\'s Second Law', 'Newton\'s Third Law', 'Law of Gravity'],
      correctAnswer: 2,
      explanation: 'This is Newton\'s Third Law of Motion.',
      category: 'Physics',
      difficulty: 1
    }
  ],
  'Chemistry': [
    {
      id: 'c1',
      text: 'What is the chemical symbol for Water?',
      options: ['CO2', 'H2O', 'O2', 'NaCl'],
      correctAnswer: 1,
      explanation: 'Water is composed of two hydrogen atoms and one oxygen atom (H2O).',
      category: 'Chemistry',
      difficulty: 1
    },
    {
      id: 'c2',
      text: 'Which gas do plants absorb during photosynthesis?',
      options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
      correctAnswer: 2,
      explanation: 'Plants take in Carbon Dioxide and release Oxygen.',
      category: 'Chemistry',
      difficulty: 1
    },
    {
      id: 'c3',
      text: 'What is the pH of pure water?',
      options: ['1', '7', '14', '0'],
      correctAnswer: 1,
      explanation: 'Pure water is neutral, with a pH of 7.',
      category: 'Chemistry',
      difficulty: 1
    }
  ],
  'Biology': [
    {
      id: 'b1',
      text: 'What is the "powerhouse" of the cell?',
      options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Vacuole'],
      correctAnswer: 2,
      explanation: 'Mitochondria produce energy for the cell.',
      category: 'Biology',
      difficulty: 1
    },
    {
      id: 'b2',
      text: 'Which part of the plant is responsible for photosynthesis?',
      options: ['Root', 'Stem', 'Leaf', 'Flower'],
      correctAnswer: 2,
      explanation: 'Leaves contain chlorophyll which captures sunlight for photosynthesis.',
      category: 'Biology',
      difficulty: 1
    },
    {
      id: 'b3',
      text: 'How many chambers does the human heart have?',
      options: ['2', '3', '4', '5'],
      correctAnswer: 2,
      explanation: 'The human heart has four chambers: two atria and two ventricles.',
      category: 'Biology',
      difficulty: 1
    }
  ],
  'Geography': [
    {
      id: 'g1',
      text: 'Which is the longest river in the world?',
      options: ['Amazon', 'Nile', 'Mississippi', 'Yangtze'],
      correctAnswer: 1,
      explanation: 'The Nile is traditionally considered the longest river in the world.',
      category: 'Geography',
      difficulty: 1
    },
    {
      id: 'g2',
      text: 'Which continent is the Sahara Desert located in?',
      options: ['Asia', 'Africa', 'South America', 'Australia'],
      correctAnswer: 1,
      explanation: 'The Sahara is located in North Africa.',
      category: 'Geography',
      difficulty: 1
    },
    {
      id: 'g3',
      text: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 2,
      explanation: 'Paris is the capital of France.',
      category: 'Geography',
      difficulty: 1
    }
  ],
  'Nigerian History': [
    {
      id: 'nh1',
      text: 'In what year did Nigeria gain independence?',
      options: ['1957', '1960', '1963', '1970'],
      correctAnswer: 1,
      explanation: 'Nigeria gained independence from Britain on October 1, 1960.',
      category: 'Nigerian History',
      difficulty: 1
    },
    {
      id: 'nh2',
      text: 'Who was the first Prime Minister of Nigeria?',
      options: ['Nnamdi Azikiwe', 'Abubakar Tafawa Balewa', 'Obafemi Awolowo', 'Ahmadu Bello'],
      correctAnswer: 1,
      explanation: 'Sir Abubakar Tafawa Balewa was the first Prime Minister.',
      category: 'Nigerian History',
      difficulty: 2
    },
    {
      id: 'nh3',
      text: 'Which empire was located in Northern Nigeria before colonial rule?',
      options: ['Oyo Empire', 'Benin Empire', 'Kanem-Bornu Empire', 'Asante Empire'],
      correctAnswer: 2,
      explanation: 'The Kanem-Bornu Empire was a major power in the Lake Chad region.',
      category: 'Nigerian History',
      difficulty: 2
    }
  ],
  'General Knowledge': [
    {
      id: 'gk1',
      text: 'Who painted the Mona Lisa?',
      options: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Claude Monet'],
      correctAnswer: 2,
      explanation: 'Leonardo da Vinci painted the Mona Lisa in the early 16th century.',
      category: 'General Knowledge',
      difficulty: 1
    },
    {
      id: 'gk2',
      text: 'Which is the largest planet in our solar system?',
      options: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
      correctAnswer: 2,
      explanation: 'Jupiter is the largest planet.',
      category: 'General Knowledge',
      difficulty: 1
    },
    {
      id: 'gk3',
      text: 'What is the currency used in Japan?',
      options: ['Yuan', 'Won', 'Yen', 'Dollar'],
      correctAnswer: 2,
      explanation: 'The Yen is the official currency of Japan.',
      category: 'General Knowledge',
      difficulty: 1
    }
  ],
  'Revelations': [
    {
      id: 'rev-1',
      text: 'What is the specific name of the genetic material God took from His own body to couple Lord Adam?',
      options: ['Zoe-cells', 'Psuche-dust', 'Ribber', 'Nanda-fluid'],
      correctAnswer: 2,
      explanation: 'God took Ribber from His own body to couple Lord Adam.',
      category: 'Revelations',
      difficulty: 1
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
      category: 'Revelations',
      difficulty: 1
    }
  ]
};

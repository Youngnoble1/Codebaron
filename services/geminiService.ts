
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Category } from "../types";
import { FALLBACK_QUESTIONS } from "./fallbackQuestions";

const QUESTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      minItems: 4,
      maxItems: 4
    },
    correctAnswer: { type: Type.INTEGER, description: "Index 0 to 3" },
    explanation: { type: Type.STRING }
  },
  required: ["text", "options", "correctAnswer", "explanation"]
};

// Helper to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// Cache management
const CACHE_KEY_PREFIX = 'arkumen_q_cache_';

const getCache = (key: string): Question[] => {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
    return cached ? JSON.parse(cached) : [];
  } catch (e) {
    return [];
  }
};

const setCache = (key: string, questions: Question[]) => {
  try {
    // Limit cache size per category to 200 to avoid localStorage limits
    const limited = questions.slice(-200);
    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(limited));
  } catch (e) {
    console.warn("Cache limit reached or failed to save", e);
  }
};

export const fetchQuestions = async (
  count: number,
  category?: Category,
  difficultyStart: number = 1,
  mode?: string
): Promise<Question[]> => {
  const cacheKey = mode && category ? `${mode}_${category}` : (mode || category || 'General Knowledge');
  const cachedQuestions = getCache(cacheKey);

  // Determine if it is an academic subject or trivia
  const academicSubjects = [
    'Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Geography', 
    'Basic Science', 'Nigerian History', 'Global Current Affairs', 'Nigerian Current Affairs',
    'English Studies', 'Intermediate Science', 'Digital Technologies', 'Social & Citizenship Studies',
    'Physical & Health Education', 'Religious Studies (CRS)', 'Cultural & Creative Arts', 'Nigerian Languages',
    'French'
  ];
  const isAcademic = category && academicSubjects.includes(category);

  // If we have enough in cache, return them but also fetch a few fresh ones in background
  if (cachedQuestions.length >= count) {
    // Return randomized selection from cache
    const selected = shuffleArray(cachedQuestions).slice(0, count);
    
    // Background fetch 5 fresh questions to keep the pool updated
    fetchFreshQuestions(5, category, difficultyStart, mode)
      .then(fresh => {
        const updatedCache = [...cachedQuestions, ...fresh];
        // Remove duplicates by text
        const unique = Array.from(new Map(updatedCache.map(q => [q.text, q])).values());
        setCache(cacheKey, unique);
      })
      .catch(err => {
        console.warn("Background question fetch failed:", err);
      });

    return selected.map(randomizeOptions);
  }

  // Not enough in cache, fetch full batch
  const fresh = await fetchFreshQuestions(count, category, difficultyStart, mode);
  const updatedCache = [...cachedQuestions, ...fresh];
  const unique = Array.from(new Map(updatedCache.map(q => [q.text, q])).values());
  setCache(cacheKey, unique);

  return shuffleArray(unique).slice(0, count).map(randomizeOptions);
};

export const researchTopic = async (topic: string, context: string): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return `### ${topic}\n\n*Educational summary is currently unavailable because the AI service is not configured.*\n\n**Topic Context:** ${context}\n\nTo enable AI research, please configure your Gemini API key in the environment variables.`;
  }
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Research and provide a concise educational summary about the topic: "${topic}". 
      Context: This topic appeared in a question about: "${context}".
      Provide key facts, historical context if relevant, and core concepts that a student should know. 
      Format the output in clean Markdown with sections.`,
      config: {
        systemInstruction: "You are an expert academic tutor. Provide clear, accurate, and concise educational content.",
      }
    });
    return response.text || "No research data found.";
  } catch (error) {
    console.error('Research error:', error);
    return "Failed to fetch research data. Please try again later.";
  }
};

export const prewarmCache = async (categories: string[]) => {
  // Fetch 10 questions for each category in background
  for (const cat of categories) {
    fetchFreshQuestions(10, cat as Category)
      .then(fresh => {
        const cached = getCache(cat);
        const updated = [...cached, ...fresh];
        const unique = Array.from(new Map(updated.map(q => [q.text, q])).values());
        setCache(cat, unique);
      })
      .catch(() => {});
  }
};

const fetchFreshQuestions = async (
  count: number,
  category?: Category,
  difficultyStart: number = 1,
  mode?: string,
  retries: number = 3
): Promise<Question[]> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API key is not configured. Using fallback questions.");
    return shuffleArray(FALLBACK_QUESTIONS).slice(0, count).map(q => ({
      ...q,
      category: category || q.category
    }));
  }
  const ai = new GoogleGenAI({ apiKey });

  const academicSubjects = [
    'Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Geography', 
    'Basic Science', 'Nigerian History', 'Global Current Affairs', 'Nigerian Current Affairs',
    'English Studies', 'Intermediate Science', 'Digital Technologies', 'Social & Citizenship Studies',
    'Physical & Health Education', 'Religious Studies (CRS)', 'Cultural & Creative Arts', 'Nigerian Languages',
    'French'
  ];
  const isAcademic = category && academicSubjects.includes(category);

  let context = "";
  if (mode === 'UME') {
    context = `JAMB (Unified Tertiary Matriculation Examination) past questions for the subject: ${category || "General Knowledge"}. Focus on high-level secondary school exit standards in Nigeria.`;
  } else if (mode === 'SSCE') {
    context = `WAEC (West African Examinations Council) past questions for the subject: ${category || "General Knowledge"}. Focus on standard West African secondary school curriculum.`;
  } else if (mode === 'GCE') {
    context = `GCE (General Certificate Examination) past questions for the subject: ${category || "General Knowledge"}. Focus on international secondary school standards.`;
  } else if (mode === 'NECO') {
    context = `NECO (National Examinations Council) past questions for the subject: ${category || "General Knowledge"}. Focus on Nigerian national secondary school curriculum.`;
  } else if (mode === 'JSSCE') {
    context = `JSSCE (Junior Secondary School Certificate Examination) past questions for the subject: ${category || "General Knowledge"}. 
    IMPORTANT: Follow the new Nigerian JSS curriculum (2025/2026 overhaul). 
    Focus on practical vocational skills, digital literacy (coding, robotics), and national identity (Nigerian History). 
    Intermediate Science replaces Basic Science. English Studies includes literature.`;
  } else if (isAcademic) {
    context = `Subject: ${category}. Ensure questions cover concepts typical for Nigerian and international secondary school curricula.`;
  } else {
    context = `Category: ${category || "General Knowledge"}. Focus on high-stakes Millionaire-style general trivia.`;
  }

  const prompt = `Generate ${count} unique, high-quality trivia questions for a game called Arkumen.
  Target Audience: High School students (JSS1 - SS3 context) for school subjects, or general adults for trivia.
  
  Context: ${context}
  
  CRITICAL: Ensure every single question is strictly about ${category || "the specified context"}. 
  Do NOT include questions from other subjects. 
  For example, if the subject is Mathematics, every question MUST be a mathematical problem or concept.
  
  Difficulty level: starting at ${difficultyStart}/36.
  Questions must be accurate, engaging, and have 4 clear options.
  
  To ensure variety and reduce repetition, use the following random seed for this session: ${Date.now()}_${Math.random()}.
  Generate completely different questions from any previous sessions.
  
  Output the response as a JSON array of question objects.`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: QUESTION_SCHEMA
          },
          tools: [{ googleSearch: {} }]
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");
      const rawQuestions = JSON.parse(text);
      
      return rawQuestions.map((q: any, index: number) => ({
        ...q,
        id: Math.random().toString(36).substr(2, 9),
        difficulty: difficultyStart + index,
        category: category || (mode as Category) || "General Knowledge"
      }));
    } catch (error: any) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      
      if (attempt === retries) {
        console.error(`Failed to fetch questions after ${retries + 1} attempts. Using fallbacks.`);
        return shuffleArray(FALLBACK_QUESTIONS).slice(0, count).map(q => ({
          ...q,
          category: category || q.category
        }));
      }
      
      // Exponential backoff: 1s, 2s, 4s...
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return []; // Should not reach here due to throw
};

const randomizeOptions = (q: Question): Question => {
  const optionsWithIndices = q.options.map((opt, i) => ({ opt, i }));
  const shuffled = shuffleArray(optionsWithIndices);
  const newCorrectIndex = shuffled.findIndex(item => item.i === q.correctAnswer);
  
  return {
    ...q,
    options: shuffled.map(item => item.opt),
    correctAnswer: newCorrectIndex
  };
};

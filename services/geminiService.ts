
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Question, Category, Difficulty } from "../types";
import { QUESTION_BANK } from "./questionBank";

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
const CACHE_KEY_PREFIX = 'arkumen_q_cache_v4_';

// Cleanup old cache versions
try {
  const oldPrefix = 'arkumen_q_cache_';
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(oldPrefix) && !key.startsWith(CACHE_KEY_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
} catch (e) {
  // Ignore localStorage errors
}

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

// Global rate limit state
let isRateLimited = false;
let rateLimitResetTime = 0;

export const getRateLimitStatus = () => ({
  isRateLimited,
  resetTime: rateLimitResetTime,
  remainingMs: Math.max(0, rateLimitResetTime - Date.now())
});

const checkRateLimit = (): boolean => {
  if (isRateLimited && Date.now() < rateLimitResetTime) {
    return true;
  }
  isRateLimited = false;
  return false;
};

const setRateLimit = (durationMs: number = 60000) => {
  isRateLimited = true;
  rateLimitResetTime = Date.now() + durationMs;
  console.warn(`[AI] Rate limit encountered. Pausing AI tasks for ${durationMs / 1000}s`);
};

export const fetchQuestions = async (
  count: number,
  category?: Category,
  difficulty: Difficulty = Difficulty.EASY,
  mode?: string
): Promise<Question[]> => {
  const cacheKey = mode && category ? `${mode}_${category}_${difficulty}` : (mode ? `${mode}_${difficulty}` : (category ? `${category}_${difficulty}` : `General Knowledge_${difficulty}`));
  const cachedQuestions = getCache(cacheKey);

  const diffMap: Record<Difficulty, number> = {
    [Difficulty.EASY]: 1,
    [Difficulty.MEDIUM]: 2,
    [Difficulty.HARD]: 3
  };
  const diffValue = diffMap[difficulty];

  // 1. Check local static bank first (Guaranteed subject accuracy)
  let staticQuestions = (category ? (QUESTION_BANK[category] || []) : QUESTION_BANK['General Knowledge'])
    .filter(q => q.difficulty === diffValue);
  
  if (staticQuestions.length === 0) {
    staticQuestions = category ? (QUESTION_BANK[category] || []) : QUESTION_BANK['General Knowledge'];
  }
  
  // If we have enough in cache or static bank, use them
  const pool = [...cachedQuestions, ...staticQuestions];
  const uniquePool = Array.from(new Map(pool.map(q => [q.text, q])).values());

  if (uniquePool.length >= count) {
    const selected = shuffleArray(uniquePool).slice(0, count);
    
    // Background fetch fresh ones to keep the pool updated if API key exists
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (apiKey && !checkRateLimit()) {
      // Only fetch if cache is low (less than 30 questions)
      if (cachedQuestions.length < 30) {
        // Delay background fetch to avoid burst
        setTimeout(() => {
          if (checkRateLimit()) return;
          fetchFreshQuestions(10, category, difficulty, mode)
            .then(fresh => {
              const updatedCache = [...cachedQuestions, ...fresh];
              const unique = Array.from(new Map(updatedCache.map(q => [q.text, q])).values());
              setCache(cacheKey, unique);
            })
            .catch((e) => {
              const isQuota = e?.message?.includes("RESOURCE_EXHAUSTED") || e?.status === "RESOURCE_EXHAUSTED" || e?.code === 429;
              if (isQuota) setRateLimit(120000); 
            });
        }, 15000); // Increased delay
      }
    }

    return selected.map(randomizeOptions);
  }

  // 2. If pool is small and API key exists, fetch from AI
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (apiKey && !checkRateLimit()) {
    try {
      const fetchCount = Math.max(count, 15);
      const fresh = await fetchFreshQuestions(fetchCount, category, difficulty, mode);
      
      const updatedCache = [...cachedQuestions, ...fresh];
      const unique = Array.from(new Map(updatedCache.map(q => [q.text, q])).values());
      setCache(cacheKey, unique);
      
      const finalPool = uniquePool.length > 0 ? unique : fresh;
      const resultCount = Math.min(finalPool.length, count);
      
      return shuffleArray(finalPool).slice(0, resultCount).map(randomizeOptions);
    } catch (e) {
      console.warn("AI fetch failed, using static pool");
    }
  }

  // 3. Last resort: just return whatever we have in the static bank
  return shuffleArray(staticQuestions).slice(0, count).map(randomizeOptions);
};

export const researchTopic = async (topic: string, context: string): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return `### ${topic}\n\n*Educational summary is currently unavailable because the AI service is not configured.*\n\n**Topic Context:** ${context}\n\nTo enable AI research, please configure your Gemini API key in the environment variables.`;
  }
  
  if (checkRateLimit()) {
    return `### ${topic}\n\n*AI Research is temporarily paused due to API quota limits. Please try again in a few minutes.*\n\n**Topic Context:** ${context}`;
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
  } catch (error: any) {
    console.error('Research error:', error);
    const isQuota = error?.message?.includes("RESOURCE_EXHAUSTED") || error?.status === "RESOURCE_EXHAUSTED" || error?.code === 429;
    if (isQuota) setRateLimit(60000);
    return "Failed to fetch research data. Please try again later.";
  }
};

export const generateWarriorTitle = async (points: number, highScore: number, streak: number): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || checkRateLimit()) return "Initiate";

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, epic, 2-3 word "Warrior Title" for a trivia player with these stats:
      - Royalty Points: ${points}
      - Highest Score: ${highScore}
      - Longest Streak: ${streak}
      
      The title should sound like it belongs in a high-fantasy arena or elite academy. Examples: "Grand Sage of Logic", "Eternal Streak Master", "Novice Truth-Seeker".
      Return ONLY the title string.`,
      config: {
        systemInstruction: "You are the Grand Master of the Arkumen Arena. You bestow epic titles upon warriors based on their prowess.",
      }
    });
    return response.text?.trim() || "Initiate";
  } catch (error) {
    return "Initiate";
  }
};

export const analyzePerformance = async (stats: { score: number; streak: number; won: boolean; category: string }): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || checkRateLimit()) return "";

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this trivia game performance and provide a one-sentence epic feedback or tip:
      - Score: ${stats.score}
      - Max Streak: ${stats.streak}
      - Result: ${stats.won ? 'Victory' : 'Defeat'}
      - Category: ${stats.category}
      
      Keep it under 20 words. Be encouraging but sound like a legendary arena master.`,
      config: {
        systemInstruction: "You are the Grand Master of the Arkumen Arena. You provide brief, epic feedback to warriors after their battles.",
      }
    });
    return response.text?.trim() || "";
  } catch (error) {
    return "";
  }
};

export const isAIActive = (): boolean => {
  return !!(process.env.GEMINI_API_KEY || process.env.API_KEY);
};

export const prewarmCache = async (categories: string[]) => {
  // Only pre-warm if AI is active and not rate limited
  if (!isAIActive() || checkRateLimit()) return;

  // Fetch questions for each category sequentially with a long delay to avoid rate limits
  // We only pre-warm a few essential categories to save quota
  const essentialCategories = categories.slice(0, 3); 

  for (const cat of essentialCategories) {
    try {
      if (checkRateLimit()) break;

      // Check if we already have enough in cache
      const cacheKey = `${cat}_${Difficulty.EASY}`;
      const cached = getCache(cacheKey);
      if (cached.length >= 10) continue;

      const fresh = await fetchFreshQuestions(10, cat as Category, Difficulty.EASY);
      const updated = [...cached, ...fresh];
      const unique = Array.from(new Map(updated.map(q => [q.text, q])).values());
      setCache(cacheKey, unique);
      
      // Wait 15 seconds between categories to be very safe with RPM limits
      await new Promise(resolve => setTimeout(resolve, 15000));
    } catch (e: any) {
      if (e?.message?.includes("RESOURCE_EXHAUSTED") || e?.status === "RESOURCE_EXHAUSTED" || e?.code === 429) {
        setRateLimit(300000); // 5 minutes pause on pre-warm error
        break;
      }
    }
  }
};

const fetchFreshQuestions = async (
  count: number,
  category?: Category,
  difficulty: Difficulty = Difficulty.EASY,
  mode?: string,
  retries: number = 3
): Promise<Question[]> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    const staticQuestions = category ? (QUESTION_BANK[category] || []) : QUESTION_BANK['General Knowledge'];
    return shuffleArray(staticQuestions).slice(0, count);
  }
  const ai = new GoogleGenAI({ apiKey });
  console.log(`[AI] Fetching ${count} ${difficulty} questions for subject: ${category || "General Knowledge"} (Mode: ${mode || "Standard"})`);

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

  const difficultyPrompt = {
    [Difficulty.EASY]: "EASY: Common knowledge, very simple concepts that most people know. Straightforward questions.",
    [Difficulty.MEDIUM]: "MEDIUM: Specific knowledge, requires some study or familiarity with the subject. More detailed concepts.",
    [Difficulty.HARD]: "HARD: Quite challenging and obscure, requires deep expertise or specialized knowledge. Complex or rare facts."
  }[difficulty];

  const prompt = `Generate ${count} unique, high-quality ${category || "General Knowledge"} trivia questions for Arkumen.
  Context: ${context}
  Difficulty: ${difficultyPrompt}
  
  Requirements:
  - Subject: Strictly "${category || "General Knowledge"}".
  - Format: JSON array of objects with {text, options, correctAnswer, explanation}.
  - Options: Exactly 4 strings.
  - CorrectAnswer: Index 0-3.
  - Seed: ${Date.now()}_${Math.random()}.`;

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
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");
      const rawQuestions = JSON.parse(text);
      
      return rawQuestions.map((q: any) => ({
        ...q,
        id: Math.random().toString(36).substr(2, 9),
        difficulty: difficulty === Difficulty.EASY ? 1 : (difficulty === Difficulty.MEDIUM ? 2 : 3),
        category: category || (mode as Category) || "General Knowledge"
      }));
    } catch (error: any) {
      const isQuotaError = error?.message?.includes("RESOURCE_EXHAUSTED") || error?.status === "RESOURCE_EXHAUSTED" || error?.code === 429;
      
      if (isQuotaError) {
        setRateLimit(120000); // 2 minutes pause on any quota error
      }

      console.error(`Attempt ${attempt + 1} failed:`, error);
      
      if (attempt === retries) {
        console.error(`Failed to fetch questions after ${retries + 1} attempts. Using static bank.`);
        const staticQuestions = category ? (QUESTION_BANK[category] || []) : QUESTION_BANK['General Knowledge'];
        return shuffleArray(staticQuestions).slice(0, count);
      }
      
      // Longer backoff for quota errors
      const delay = isQuotaError 
        ? (Math.pow(2, attempt) * 5000) + (Math.random() * 2000) // 5s, 10s, 20s...
        : (Math.pow(2, attempt) * 1000); // 1s, 2s, 4s...
        
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Fallback if loop finishes without returning (shouldn't happen)
  const staticQuestions = category ? (QUESTION_BANK[category] || []) : QUESTION_BANK['General Knowledge'];
  return shuffleArray(staticQuestions).slice(0, count);
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

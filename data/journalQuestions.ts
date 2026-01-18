// Journal Question Structure - shared between Journal and Profile pages

export const JOURNAL_QUESTION_STRUCTURE = {
  sleepRecovery: [
    { id: 'slept_well', positive: true },
    { id: 'slept_through', positive: true },
    { id: 'woke_rested', positive: true },
  ],
  lifestyle: [
    { id: 'training', positive: true },
    { id: 'alcohol', positive: false },
    { id: 'caffeine_late', positive: false },
    { id: 'morning_sun', positive: true },
    { id: 'screen_before_bed', positive: false },
  ],
  mental: [
    { id: 'stressed', positive: false },
    { id: 'focused', positive: true },
    { id: 'good_mood', positive: true },
    { id: 'anxious', positive: false },
  ],
  body: [
    { id: 'digestion_ok', positive: true },
    { id: 'hydrated', positive: true },
    { id: 'sick', positive: false },
  ],
} as const;

export type CategoryKey = keyof typeof JOURNAL_QUESTION_STRUCTURE;
export type QuestionId = typeof JOURNAL_QUESTION_STRUCTURE[CategoryKey][number]['id'];

export const ALL_QUESTION_IDS = Object.values(JOURNAL_QUESTION_STRUCTURE).flat();

// localStorage key for hidden questions
export const HIDDEN_QUESTIONS_KEY = 'stax_hidden_journal_questions';

// Helper to get hidden questions from localStorage
export function getHiddenQuestions(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(HIDDEN_QUESTIONS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Helper to save hidden questions to localStorage
export function setHiddenQuestions(questionIds: string[]): void {
  localStorage.setItem(HIDDEN_QUESTIONS_KEY, JSON.stringify(questionIds));
}

// Helper to toggle a question's visibility
export function toggleQuestionVisibility(questionId: string): string[] {
  const hidden = getHiddenQuestions();
  const newHidden = hidden.includes(questionId)
    ? hidden.filter(id => id !== questionId)
    : [...hidden, questionId];
  setHiddenQuestions(newHidden);
  return newHidden;
}

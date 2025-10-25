export type Page = 'table-of-contents' | 'ai-tutor' | 'compendium' | 'performance-dashboard';

// FIX: Add LearningStatus type definition
export type LearningStatus = 'new' | 'learning' | 'review' | 'mastered';

// SRS Progress Item
export interface ProgressItem {
    id: string;
    srsLevel: number; // 0 (new) to 8 (mastered)
    nextReview: string; // ISO date string
    lastCorrect: string | null; // ISO date string
    history: { correct: number; incorrect: number };
}

export interface UserProgress {
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export interface UserStats {
    streak: number;
    lastLogin: string; // ISO date string
    achievements: string[]; // Array of achievement IDs
    isNewUser: boolean; // To track if the user needs assessment
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
}

export interface VocabularyWord {
  id: string;
  word: string;
  furigana: string;
  meaning_vi: string;
  type: string; // e.g., 'Danh từ', 'Động từ nhóm 1', 'Tính từ -i'
  explanation_vi: string; // Detailed explanation of nuance and usage
  example_jp: string; // Should include furigana in [kanji]{reading} format
  example_en: string;
}

export interface GrammarPoint {
  id:string;
  grammar: string;
  meaning_vi: string;
  formation: string;
  explanation_vi: string; // Detailed explanation of usage, common mistakes, etc.
  example_jp: string; // Should include furigana in [kanji]{reading} format
  example_en: string;
}

export interface KanjiExample {
  word: string;
  reading: string;
  meaning_vi: string;
}

export interface KanjiCharacter {
  id: string;
  kanji: string;
  meaning_vi: string;
  on_yomi: string;
  kun_yomi: string;
  stroke_count: number;
  radical: string;
  mnemonic_vi: string; // A creative mnemonic to help remember the kanji
  examples: KanjiExample[];
}


export interface Chapter {
  chapter: number;
  title: string;
  vocabulary: VocabularyWord[];
  grammar: GrammarPoint[];
  kanji: KanjiCharacter[];
  dependencies?: number[]; // Prerequisite chapter numbers
}

export interface QuizQuestion {
    id?: string; // Optional ID for tracking
    question: string;
    options: string[];
    answerIndex: number;
    explanation?: string;
    relatedItemId?: string; // ID of the LearningItem this question is about
}

export type LearningItem = VocabularyWord | GrammarPoint | KanjiCharacter;

export interface CustomQuiz {
    title: string;
    questions: QuizQuestion[];
}

export interface AnalysisResult {
    analysisText: string;
    reviewTopics: string[];
}

// Performance Dashboard Types
export interface PerformanceData {
    overallAccuracy: number;
    skillAccuracy: {
        vocabulary: number;
        grammar: number;
        kanji: number;
    };
    weakestItems: {
        item: LearningItem;
        progress: ProgressItem;
    }[];
}
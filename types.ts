export type Page = 'table-of-contents' | 'ai-tutor';

export type LearningStatus = 'new' | 'learning' | 'review' | 'mastered';

export interface UserProgress {
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export interface UserStats {
    streak: number;
    lastLogin: string; // ISO date string
    achievements: string[]; // Array of achievement IDs
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
  example_jp: string; // Should include furigana in [kanji]{reading} format
  example_en: string;
}

export interface GrammarPoint {
  id:string;
  grammar: string;
  meaning_vi: string;
  formation: string;
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
  examples: KanjiExample[];
}


export interface Chapter {
  chapter: number;
  title: string;
  vocabulary: VocabularyWord[];
  grammar: GrammarPoint[];
  dependencies?: number[]; // Prerequisite chapter numbers
}

export interface QuizQuestion {
    question: string;
    options: string[];
    answerIndex: number;
    explanation?: string;
}

export type LearningItem = VocabularyWord | GrammarPoint | KanjiCharacter;
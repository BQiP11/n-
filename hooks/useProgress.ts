
import { useState, useCallback, useEffect, useMemo } from 'react';
// FIX: Import LearningStatus type
import type { ProgressItem, UserProgress, Chapter, UserStats, Achievement, LearningItem, PerformanceData, VocabularyWord, GrammarPoint, KanjiCharacter, LearningStatus } from '../types';
import { useNotifications } from '../contexts/NotificationContext';

const ITEM_PROGRESS_KEY = 'n3-chronos-item-progress';
const USER_PROGRESS_KEY = 'n3-chronos-user-progress';
const USER_STATS_KEY = 'n3-chronos-user-stats';

const XP_PER_LEVEL = 250;
const XP_FOR_LEVEL_UP = 10; // XP gained per SRS level up
const XP_FOR_QUIZ_CORRECT_ANSWER = 5;
const XP_FOR_PRACTICE_CORRECT = 2;

// SRS Intervals in days (based on a simplified SM-2 algorithm)
const SRS_INTERVALS = [0, 1, 3, 7, 14, 30, 90, 180, 365]; // Level 0 to 8

const CHAPTER_UNLOCK_THRESHOLD = 0.75; // 75% mastered (SRS level >= 5) to unlock next chapter

const ACHIEVEMENTS: Achievement[] = [
    { id: 'FIRST_STEP', name: 'Bước đầu tiên', description: 'Hoàn thành bài học đầu tiên.' },
    { id: 'STREAK_3', name: 'Nhiệt huyết', description: 'Duy trì chuỗi học 3 ngày.' },
    { id: 'PERFECT_QUIZ', name: 'Hoàn hảo', description: 'Đạt điểm tuyệt đối trong một bài kiểm tra.' },
    { id: 'LEVEL_5', name: 'Nhà thám hiểm', description: 'Đạt cấp độ 5.' },
];

const isYesterday = (date: Date): boolean => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
};

const isToday = (date: Date): boolean => {
    return date.toDateString() === new Date().toDateString();
};

const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
        console.error(`Failed to load from ${key}`, error);
        return defaultValue;
    }
};

export const useProgress = (textbook: Chapter[]) => {
  const [itemProgress, setItemProgress] = useState<Record<string, ProgressItem>>(() => loadFromStorage(ITEM_PROGRESS_KEY, {}));
  const [userProgress, setUserProgress] = useState<UserProgress>(() => loadFromStorage(USER_PROGRESS_KEY, { level: 1, xp: 0, xpToNextLevel: XP_PER_LEVEL }));
  const [userStats, setUserStats] = useState<UserStats>(() => loadFromStorage(USER_STATS_KEY, { streak: 0, lastLogin: '', achievements: [], isNewUser: true }));
  const { addNotification } = useNotifications();

  useEffect(() => { localStorage.setItem(ITEM_PROGRESS_KEY, JSON.stringify(itemProgress)); }, [itemProgress]);
  useEffect(() => { localStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(userProgress)); }, [userProgress]);
  useEffect(() => { localStorage.setItem(USER_STATS_KEY, JSON.stringify(userStats)); }, [userStats]);
  
  const allItemsMap = useMemo(() => {
    const map = new Map<string, LearningItem>();
    textbook.forEach(chapter => {
      [...chapter.vocabulary, ...chapter.grammar, ...chapter.kanji].forEach(item => {
        map.set(item.id, item);
      });
    });
    return map;
  }, [textbook]);


  const checkAchievements = useCallback((updatedProgress: UserProgress, updatedStats: UserStats, quizScore?: { score: number, total: number }) => {
    const newAchievements: string[] = [];
    
    if (quizScore && quizScore.score === quizScore.total && !updatedStats.achievements.includes('PERFECT_QUIZ')) newAchievements.push('PERFECT_QUIZ');
    if (updatedProgress.level >= 5 && !updatedStats.achievements.includes('LEVEL_5')) newAchievements.push('LEVEL_5');
    if (updatedStats.streak >= 3 && !updatedStats.achievements.includes('STREAK_3')) newAchievements.push('STREAK_3');

    if (newAchievements.length > 0) {
        setUserStats(prev => {
            const finalAchievements = [...prev.achievements, ...newAchievements];
            newAchievements.forEach(id => {
                const achievement = ACHIEVEMENTS.find(a => a.id === id);
                if (achievement) addNotification(achievement);
            });
            return { ...prev, achievements: finalAchievements };
        });
    }
  }, [addNotification]);

  const addXp = useCallback((amount: number, quizScore?: { score: number, total: number }) => {
    setUserProgress(current => {
      let newXp = current.xp + amount;
      let newLevel = current.level;
      let newXpToNextLevel = current.xpToNextLevel;

      let leveledUp = false;
      while (newXp >= newXpToNextLevel) {
        newXp -= newXpToNextLevel;
        newLevel += 1;
        newXpToNextLevel = Math.floor(XP_PER_LEVEL * Math.pow(1.1, newLevel - 1));
        leveledUp = true;
        addNotification({ id: `LEVEL_${newLevel}`, name: `Đạt cấp độ ${newLevel}!`, description: 'Tiếp tục phát huy!' });
      }
      
      const updatedProgress = { level: newLevel, xp: newXp, xpToNextLevel: newXpToNextLevel };
      if (leveledUp) {
          checkAchievements(updatedProgress, userStats, quizScore);
      }
      return updatedProgress;
    });
  }, [checkAchievements, userStats, addNotification]);

  useEffect(() => {
    if (userStats.isNewUser) return;
    const lastLoginDate = userStats.lastLogin ? new Date(userStats.lastLogin) : null;
    const now = new Date();

    if (!lastLoginDate || !isToday(lastLoginDate)) {
        if (lastLoginDate && isYesterday(lastLoginDate)) {
            setUserStats(prev => {
                const newStreak = prev.streak + 1;
                const updatedStats = { ...prev, streak: newStreak, lastLogin: now.toISOString() };
                checkAchievements(userProgress, updatedStats);
                return updatedStats;
            });
        } else if (!lastLoginDate || !isToday(lastLoginDate)) {
             setUserStats(prev => ({ ...prev, streak: 1, lastLogin: now.toISOString() }));
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userStats.isNewUser]);

  const getProgressItem = useCallback((itemId: string): ProgressItem => {
    return itemProgress[itemId] || {
      id: itemId,
      srsLevel: 0,
      nextReview: new Date().toISOString(),
      lastCorrect: null,
      history: { correct: 0, incorrect: 0 },
    };
  }, [itemProgress]);

  // FIX: Implement and export getItemStatus to derive LearningStatus from ProgressItem
  const getItemStatus = useCallback((itemId: string): LearningStatus => {
    const item = getProgressItem(itemId);
    if (item.srsLevel >= 5) return 'mastered';
    const now = new Date();
    if (new Date(item.nextReview) <= now && item.srsLevel > 0) return 'review';
    if (item.srsLevel > 0) return 'learning';
    return 'new';
  }, [getProgressItem]);

  // FIX: Implement and export updateItemStatus for manual status updates
  const updateItemStatus = useCallback((itemId: string, status: LearningStatus) => {
    setItemProgress(prev => {
      const current = getProgressItem(itemId);
      let newSrsLevel = current.srsLevel;
      let nextReviewDate = new Date(current.nextReview);

      switch (status) {
        case 'mastered':
          newSrsLevel = Math.max(5, current.srsLevel || 5);
          nextReviewDate = addDays(new Date(), SRS_INTERVALS[newSrsLevel]);
          break;
        case 'review':
          nextReviewDate = new Date(); // Set for review now
          break;
        // 'learning' and 'new' are not manually set from the UI
      }

      const updatedItem: ProgressItem = {
        ...current,
        srsLevel: newSrsLevel,
        nextReview: nextReviewDate.toISOString(),
      };
      
      return { ...prev, [itemId]: updatedItem };
    });
  }, [getProgressItem]);

  const updateProgressItem = useCallback((itemId: string, correct: boolean) => {
    setItemProgress(prev => {
      const current = getProgressItem(itemId);
      const newHistory = {
          correct: current.history.correct + (correct ? 1 : 0),
          incorrect: current.history.incorrect + (correct ? 0 : 1),
      };

      let newSrsLevel = current.srsLevel;
      if (correct) {
          newSrsLevel = Math.min(newSrsLevel + 1, SRS_INTERVALS.length - 1);
          addXp(XP_FOR_LEVEL_UP);
      } else {
          newSrsLevel = Math.max(0, Math.floor(newSrsLevel / 2));
      }
      
      const interval = SRS_INTERVALS[newSrsLevel];
      const nextReviewDate = addDays(new Date(), interval);

      const updatedItem: ProgressItem = {
          ...current,
          srsLevel: newSrsLevel,
          nextReview: nextReviewDate.toISOString(),
          lastCorrect: correct ? new Date().toISOString() : current.lastCorrect,
          history: newHistory,
      };
      
      return { ...prev, [itemId]: updatedItem };
    });
  }, [getProgressItem, addXp]);

  const getChapterProgress = useCallback((chapter: Chapter) => {
    const allItems = [...chapter.vocabulary, ...chapter.grammar, ...chapter.kanji];
    if (allItems.length === 0) return { mastered: 0, total: 0, percentage: 0 };
    
    const masteredCount = allItems.reduce((count, item) => {
        const progress = getProgressItem(item.id);
        return count + (progress.srsLevel >= 5 ? 1 : 0); // SRS level 5+ is considered "mastered"
    }, 0);
    return { mastered: masteredCount, total: allItems.length, percentage: (masteredCount / allItems.length) };
  }, [getProgressItem]);

  const isChapterUnlocked = useCallback((chapter: Chapter) => {
      if (!chapter.dependencies || chapter.dependencies.length === 0) return true;
      
      return chapter.dependencies.every(depId => {
          const depChapter = textbook.find(c => c.chapter === depId);
          if (!depChapter) return false;
          return getChapterProgress(depChapter).percentage >= CHAPTER_UNLOCK_THRESHOLD;
      });
  }, [textbook, getChapterProgress]);
  
  const getMemoryStreamItems = useCallback((): LearningItem[] => {
    const now = new Date();
    return Object.values(itemProgress)
        .filter(p => new Date(p.nextReview) <= now)
        .sort((a,b) => a.srsLevel - b.srsLevel) // Prioritize lower SRS levels
        .map(p => allItemsMap.get(p.id))
        .filter((item): item is LearningItem => !!item);
  }, [itemProgress, allItemsMap]);
  
  // FIX: Implement and export getReviewItems
  const getReviewItems = getMemoryStreamItems;

  const recordQuizResult = useCallback((correctAnswers: number, totalQuestions: number, questionResults: { itemId: string, correct: boolean }[]) => {
    addXp(correctAnswers * XP_FOR_QUIZ_CORRECT_ANSWER, { score: correctAnswers, total: totalQuestions });
    
    questionResults.forEach(result => {
        updateProgressItem(result.itemId, result.correct);
    });

    if(correctAnswers > 0 && userStats.achievements.includes('FIRST_STEP') === false){
        const achievement = ACHIEVEMENTS.find(a => a.id === 'FIRST_STEP');
        if(achievement) {
            addNotification(achievement);
            setUserStats(prev => ({...prev, achievements: [...prev.achievements, 'FIRST_STEP']}));
        }
    }
  }, [addXp, updateProgressItem, userStats.achievements, addNotification]);

  // FIX: Implement and export recordPracticeResult for contextual exercises
  const recordPracticeResult = useCallback(() => {
    addXp(XP_FOR_PRACTICE_CORRECT);
  }, [addXp]);

  const finishAssessment = (questionResults: { itemId: string, correct: boolean }[]) => {
      questionResults.forEach(result => {
        // If correct, jump ahead in SRS
        const srsLevel = result.correct ? 4 : 0; 
        const interval = SRS_INTERVALS[srsLevel];
        const nextReviewDate = addDays(new Date(), interval);
        const progressItem: ProgressItem = {
            id: result.itemId,
            srsLevel,
            nextReview: nextReviewDate.toISOString(),
            lastCorrect: result.correct ? new Date().toISOString() : null,
            history: { correct: result.correct ? 1 : 0, incorrect: result.correct ? 0 : 1 },
        };
        setItemProgress(prev => ({ ...prev, [result.itemId]: progressItem }));
      });
      setUserStats(prev => ({ ...prev, isNewUser: false, lastLogin: new Date().toISOString(), streak: 1 }));
  };

  const getPerformanceData = useCallback((): PerformanceData => {
      const allProgressItems = Object.values(itemProgress);
      if (allProgressItems.length === 0) {
        return { overallAccuracy: 0, skillAccuracy: { vocabulary: 0, grammar: 0, kanji: 0 }, weakestItems: [] };
      }

      let totalCorrect = 0;
      let totalIncorrect = 0;
      const skillStats: Record<string, { correct: number, incorrect: number }> = {
          vocabulary: { correct: 0, incorrect: 0 },
          grammar: { correct: 0, incorrect: 0 },
          kanji: { correct: 0, incorrect: 0 },
      };

      allProgressItems.forEach(p => {
        totalCorrect += p.history.correct;
        totalIncorrect += p.history.incorrect;
        const item = allItemsMap.get(p.id);
        if (item) {
            let type: keyof typeof skillStats | undefined;
            if ('word' in item) type = 'vocabulary';
            else if ('grammar' in item) type = 'grammar';
            else if ('kanji' in item) type = 'kanji';
            
            if (type) {
                skillStats[type].correct += p.history.correct;
                skillStats[type].incorrect += p.history.incorrect;
            }
        }
      });
      
      const calculateAccuracy = (correct: number, incorrect: number) => {
        const total = correct + incorrect;
        return total > 0 ? (correct / total) * 100 : 0;
      }
      
      const weakestItems = allProgressItems
        .filter(p => p.history.incorrect > 0)
        .sort((a, b) => {
          const ratioA = a.history.correct / a.history.incorrect;
          const ratioB = b.history.correct / b.history.incorrect;
          if (ratioA !== ratioB) return ratioA - ratioB;
          return b.history.incorrect - a.history.incorrect; // Tie-break with more incorrect answers
        })
        .slice(0, 5)
        .map(p => ({ item: allItemsMap.get(p.id)!, progress: p }))
        .filter(i => i.item);

      return {
          overallAccuracy: calculateAccuracy(totalCorrect, totalIncorrect),
          skillAccuracy: {
              vocabulary: calculateAccuracy(skillStats.vocabulary.correct, skillStats.vocabulary.incorrect),
              grammar: calculateAccuracy(skillStats.grammar.correct, skillStats.grammar.incorrect),
              kanji: calculateAccuracy(skillStats.kanji.correct, skillStats.kanji.incorrect),
          },
          weakestItems,
      }
  }, [itemProgress, allItemsMap]);

  return { 
    userProgress, 
    userStats, 
    getProgressItem,
    updateProgressItem, 
    getChapterProgress, 
    recordQuizResult, 
    isChapterUnlocked, 
    getMemoryStreamItems,
    finishAssessment,
    getPerformanceData,
    // FIX: Export missing functions
    getItemStatus,
    updateItemStatus,
    getReviewItems,
    recordPracticeResult,
  };
};
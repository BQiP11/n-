import { useState, useCallback, useEffect } from 'react';
import type { LearningStatus, UserProgress, Chapter, UserStats, Achievement, LearningItem } from '../types';
import { useNotifications } from '../contexts/NotificationContext';

const ITEM_PROGRESS_KEY = 'n3-genesis-item-progress';
const USER_PROGRESS_KEY = 'n3-genesis-user-progress';
const USER_STATS_KEY = 'n3-genesis-user-stats';

const XP_PER_LEVEL = 250;
const XP_FOR_MASTERING = 15;
const XP_FOR_QUIZ_CORRECT_ANSWER = 5;
const CHAPTER_UNLOCK_THRESHOLD = 0.75; // 75% mastered to unlock next chapter

const ACHIEVEMENTS: Achievement[] = [
    { id: 'FIRST_STEP', name: 'Bước đầu tiên', description: 'Hoàn thành bài học đầu tiên.' },
    { id: 'STREAK_3', name: 'Nhiệt huyết', description: 'Duy trì chuỗi học 3 ngày.' },
    { id: 'PERFECT_QUIZ', name: 'Hoàn hảo', description: 'Đạt điểm tuyệt đối trong một bài kiểm tra.' },
    { id: 'LEVEL_5', name: 'Nhà thám hiểm', description: 'Đạt cấp độ 5.' },
];

// Helper to check if a date was yesterday
const isYesterday = (date: Date): boolean => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
};

const isToday = (date: Date): boolean => {
    return date.toDateString() === new Date().toDateString();
};


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
  const [itemProgress, setItemProgress] = useState<Record<string, LearningStatus>>(() => loadFromStorage(ITEM_PROGRESS_KEY, {}));
  const [userProgress, setUserProgress] = useState<UserProgress>(() => loadFromStorage(USER_PROGRESS_KEY, { level: 1, xp: 0, xpToNextLevel: XP_PER_LEVEL }));
  const [userStats, setUserStats] = useState<UserStats>(() => loadFromStorage(USER_STATS_KEY, { streak: 0, lastLogin: '', achievements: [] }));
  const { addNotification } = useNotifications();

  // Save progress to localStorage
  useEffect(() => { localStorage.setItem(ITEM_PROGRESS_KEY, JSON.stringify(itemProgress)); }, [itemProgress]);
  useEffect(() => { localStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(userProgress)); }, [userProgress]);
  useEffect(() => { localStorage.setItem(USER_STATS_KEY, JSON.stringify(userStats)); }, [userStats]);

  const checkAchievements = useCallback((updatedProgress: UserProgress, updatedStats: UserStats, quizScore?: { score: number, total: number }) => {
    const newAchievements: string[] = [];
    
    // Achievement: Perfect quiz
    if (quizScore && quizScore.score === quizScore.total && !updatedStats.achievements.includes('PERFECT_QUIZ')) {
        newAchievements.push('PERFECT_QUIZ');
    }
    // Achievement: Reach level 5
    if (updatedProgress.level >= 5 && !updatedStats.achievements.includes('LEVEL_5')) {
        newAchievements.push('LEVEL_5');
    }
    // Achievement: 3-day streak
    if (updatedStats.streak >= 3 && !updatedStats.achievements.includes('STREAK_3')) {
        newAchievements.push('STREAK_3');
    }

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
      }
      
      const updatedProgress = { level: newLevel, xp: newXp, xpToNextLevel: newXpToNextLevel };
      if (leveledUp) {
          // Pass current stats because state update is async
          checkAchievements(updatedProgress, userStats, quizScore);
      }
      return updatedProgress;
    });
  }, [checkAchievements, userStats]);

  // Handle daily streak
  useEffect(() => {
    const lastLoginDate = userStats.lastLogin ? new Date(userStats.lastLogin) : null;
    const now = new Date();

    if (!lastLoginDate || !isToday(lastLoginDate)) { // First login of the day
        if (lastLoginDate && isYesterday(lastLoginDate)) {
            setUserStats(prev => {
                const newStreak = prev.streak + 1;
                const updatedStats = { ...prev, streak: newStreak, lastLogin: now.toISOString() };
                checkAchievements(userProgress, updatedStats); // check for streak achievement
                return updatedStats;
            });
        } else if (!lastLoginDate || !isToday(lastLoginDate)) {
             setUserStats(prev => ({ ...prev, streak: 1, lastLogin: now.toISOString() }));
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getItemStatus = useCallback((itemId: string): LearningStatus => itemProgress[itemId] || 'new', [itemProgress]);

  const updateItemStatus = useCallback((itemId: string, newStatus: LearningStatus) => {
    const currentStatus = getItemStatus(itemId);
    if (currentStatus !== 'mastered' && newStatus === 'mastered') {
      addXp(XP_FOR_MASTERING);
    }
    setItemProgress(prev => ({ ...prev, [itemId]: newStatus }));
  }, [addXp, getItemStatus]);

  const getChapterProgress = useCallback((chapter: Chapter) => {
    const allItems = [...chapter.vocabulary, ...chapter.grammar];
    if (allItems.length === 0) return { mastered: 0, total: 0, percentage: 0 };
    
    const masteredCount = allItems.reduce((count, item) => (count + (getItemStatus(item.id) === 'mastered' ? 1 : 0)), 0);
    return { mastered: masteredCount, total: allItems.length, percentage: (masteredCount / allItems.length) };
  }, [getItemStatus]);

  const isChapterUnlocked = useCallback((chapter: Chapter) => {
      if (!chapter.dependencies || chapter.dependencies.length === 0) return true;
      
      return chapter.dependencies.every(depId => {
          const depChapter = textbook.find(c => c.chapter === depId);
          if (!depChapter) return false; // Dependency not found
          return getChapterProgress(depChapter).percentage >= CHAPTER_UNLOCK_THRESHOLD;
      });
  }, [textbook, getChapterProgress]);

  const getReviewItems = useCallback((allItems: LearningItem[]) => {
    return allItems.filter(item => getItemStatus(item.id) === 'review');
  }, [getItemStatus]);

  const recordQuizResult = useCallback((correctAnswers: number, totalQuestions: number) => {
    addXp(correctAnswers * XP_FOR_QUIZ_CORRECT_ANSWER, { score: correctAnswers, total: totalQuestions });
    if(correctAnswers > 0 && userStats.achievements.includes('FIRST_STEP') === false){
        const achievement = ACHIEVEMENTS.find(a => a.id === 'FIRST_STEP');
        if(achievement) {
            addNotification(achievement);
            setUserStats(prev => ({...prev, achievements: [...prev.achievements, 'FIRST_STEP']}));
        }
    }
  }, [addXp, addNotification, userStats.achievements]);

  return { userProgress, userStats, getItemStatus, updateItemStatus, getChapterProgress, recordQuizResult, isChapterUnlocked, getReviewItems };
};
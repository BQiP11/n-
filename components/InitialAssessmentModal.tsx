
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { generateN3Textbook, generateAssessmentTest } from '../services/geminiService';
import type { Chapter, LearningItem, QuizQuestion } from '../types';
import { useProgress } from '../hooks/useProgress';
import Modal from './Modal';
import Quiz, { WrongAnswer } from './Quiz';
import LoadingSpinner from './LoadingSpinner';

const InitialAssessmentModal: React.FC = () => {
    const [step, setStep] = useState<'welcome' | 'loading' | 'quiz' | 'complete'>('welcome');
    const [assessmentQuiz, setAssessmentQuiz] = useState<QuizQuestion[] | null>(null);
    const [allN3Items, setAllN3Items] = useState<LearningItem[] | null>(null);
    
    // Using a separate progress hook instance because this component manages its own state flow
    // before the main app state is fully active.
    const { userStats, finishAssessment } = useProgress([]);

    const loadAllItems = useCallback(async () => {
        try {
            const textbook: Chapter[] = await generateN3Textbook();
            const items = textbook.flatMap(c => [...c.vocabulary, ...c.grammar, ...c.kanji]);
            setAllN3Items(items);
            return items;
        } catch (error) {
            console.error("Failed to load textbook for assessment:", error);
            // In a real app, you might want to show an error and prevent assessment.
            return null;
        }
    }, []);

    const startAssessment = async () => {
        setStep('loading');
        let items = allN3Items;
        if (!items) {
            items = await loadAllItems();
        }

        if (items) {
            try {
                const questions = await generateAssessmentTest(items);
                setAssessmentQuiz(questions);
                setStep('quiz');
            } catch (error) {
                console.error("Failed to generate assessment quiz:", error);
                setStep('welcome'); // Reset on error
            }
        }
    };

    // FIX: Update onComplete handler signature to include questionResults
    const handleQuizComplete = (score: number, wrongAnswers: WrongAnswer[], questionResults: { itemId: string, correct: boolean }[]) => {
        finishAssessment(questionResults);
        setStep('complete');
    };

    if (!userStats.isNewUser) {
        return null;
    }

    const renderContent = () => {
        switch (step) {
            case 'welcome':
                return (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold font-display text-accent-magenta mb-4">Chào mừng đến với SYNAPSE N3!</h2>
                        <p className="text-text-secondary mb-6">
                            Để cá nhân hóa lộ trình học của bạn, hãy bắt đầu với một bài kiểm tra năng lực ngắn.
                            AI sẽ phân tích trình độ hiện tại của bạn và mở khóa các chương phù hợp.
                        </p>
                        <button
                            onClick={startAssessment}
                            className="w-full px-6 py-3 bg-accent-magenta text-white font-bold rounded-lg hover:bg-accent-pink transition-colors"
                        >
                            Bắt đầu Đánh giá
                        </button>
                    </div>
                );
            case 'loading':
                return <LoadingSpinner message="AI đang tạo bài kiểm tra năng lực..." />;
            case 'quiz':
                return assessmentQuiz && (
                    <Quiz
                        questions={assessmentQuiz}
                        title="Kiểm tra Năng lực"
                        onComplete={handleQuizComplete}
                    />
                );
            case 'complete':
                 return (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold font-display text-accent-magenta mb-4">Hoàn tất!</h2>
                        <p className="text-text-secondary mb-6">
                           AI đã phân tích kết quả và thiết lập lộ trình học tập cá nhân hóa cho bạn. 
                           Sơ đồ Tri thức đã được cập nhật. Chúc bạn học tốt!
                        </p>
                         <button
                            onClick={() => window.location.reload()} // Easiest way to refresh the app state
                            className="w-full px-6 py-3 bg-accent-magenta text-white font-bold rounded-lg hover:bg-accent-pink transition-colors"
                        >
                            Bắt đầu Học
                        </button>
                    </div>
                );
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
            <div className="glass-card rounded-2xl w-full max-w-2xl m-4 p-6">
                {renderContent()}
            </div>
        </div>
    );
};

export default InitialAssessmentModal;
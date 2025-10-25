import React, { useState, useEffect, useCallback } from 'react';
import { generateContextualExercise } from '../services/geminiService';
import type { LearningItem, QuizQuestion } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { useProgress } from '../hooks/useProgress';
import { SparklesIcon } from './Icons';

interface ContextualPracticeProps {
    item: LearningItem;
}

const ContextualPractice: React.FC<ContextualPracticeProps> = ({ item }) => {
    const [exercise, setExercise] = useState<QuizQuestion[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userAnswers, setUserAnswers] = useState<Record<string, number | null>>({});
    const { recordPracticeResult } = useProgress([]);

    const fetchExercise = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setUserAnswers({});
        try {
            const questions = await generateContextualExercise(item);
            setExercise(questions);
        } catch (e) {
            setError('Không thể tạo bài tập. Vui lòng thử lại.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [item]);

    useEffect(() => {
        fetchExercise();
    }, [fetchExercise]);

    const handleAnswerSelect = (questionId: string, optionIndex: number) => {
        if (userAnswers[questionId] !== undefined && userAnswers[questionId] !== null) return;
        
        setUserAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
        
        const question = exercise?.find(q => q.id === questionId);
        if (question && optionIndex === question.answerIndex) {
            recordPracticeResult();
        }
    };
    
    if (isLoading) {
        return <div className="py-8"><LoadingSpinner message="Đang tạo bài tập..." /></div>;
    }

    if (error) {
        return <div className="py-8"><ErrorMessage message={error} onRetry={fetchExercise} /></div>;
    }

    if (!exercise || exercise.length === 0) {
        return <p className="text-text-secondary text-center py-8">Không có bài tập nào được tạo.</p>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {exercise.map((q) => {
                const selectedAnswer = userAnswers[q.id!];
                const isAnswered = selectedAnswer !== undefined && selectedAnswer !== null;

                return (
                    <div key={q.id}>
                        <p className="font-jp mb-4 text-text-primary">{q.question}</p>
                        <div className="space-y-2">
                            {q.options.map((option, index) => {
                                let buttonClass = 'bg-bg-synapse-deep/50 hover:bg-bg-synapse-medium border-border-color';
                                if (isAnswered) {
                                    if (index === q.answerIndex) {
                                        buttonClass = 'bg-green-500/20 border-green-500 text-green-300';
                                    } else if (index === selectedAnswer) {
                                        buttonClass = 'bg-red-500/20 border-red-500 text-red-400 opacity-60';
                                    } else {
                                        buttonClass = 'opacity-50';
                                    }
                                }
                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleAnswerSelect(q.id!, index)}
                                        disabled={isAnswered}
                                        className={`w-full text-left p-3 rounded-lg border transition-all duration-300 font-jp ${buttonClass}`}
                                    >
                                        {`${String.fromCharCode(65 + index)}. ${option}`}
                                    </button>
                                );
                            })}
                        </div>
                        {isAnswered && q.explanation && (
                            <div className="mt-4 p-3 bg-bg-synapse-deep rounded-lg border border-border-color animate-fade-in">
                                <p className="text-sm font-bold text-accent-pink">Giải thích:</p>
                                <p className="text-sm text-text-secondary mt-1">{q.explanation}</p>
                            </div>
                        )}
                    </div>
                );
            })}
             <button
                onClick={fetchExercise}
                className="w-full mt-6 flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-white/5 text-text-secondary hover:bg-white/10"
            >
                <SparklesIcon className="w-4 h-4 mr-2" />
                Tạo bài tập mới
            </button>
        </div>
    );
};

export default ContextualPractice;
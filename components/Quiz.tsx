
import React, { useState, useEffect } from 'react';
import type { QuizQuestion } from '../types';
import { BrainCircuitIcon } from './Icons';
import { useProgress } from '../hooks/useProgress';

export interface WrongAnswer {
    question: string;
    userAnswer: string;
    correctAnswer: string;
}

interface QuizProps {
    questions: QuizQuestion[];
    // FIX: Update onComplete signature to include question results
    onComplete: (score: number, wrongAnswers: WrongAnswer[], questionResults: { itemId: string, correct: boolean }[]) => void;
    title: string;
}

const Quiz: React.FC<QuizProps> = ({ questions, onComplete, title }) => {
    // FIX: Moved constant to the top of the component to prevent a 'used before declaration' error.
    const XP_FOR_QUIZ_CORRECT_ANSWER = 5;
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const { recordQuizResult } = useProgress([]);

    useEffect(() => {
        setCurrentQuestionIndex(0);
        setSelectedAnswers(Array(questions.length).fill(null));
        setShowResult(false);
        setScore(0);
    }, [questions]);

    const handleAnswerSelect = (optionIndex: number) => {
        if (selectedAnswers[currentQuestionIndex] !== null) return;
        
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setSelectedAnswers(newAnswers);
        
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
                handleSubmit(newAnswers);
            }
        }, 1200);
    };

    const handleSubmit = (finalAnswers: (number | null)[]) => {
        const wrongAnswers: WrongAnswer[] = [];
        // FIX: Construct questionResults to pass to onComplete and recordQuizResult
        const questionResults: { itemId: string, correct: boolean }[] = [];
        const finalScore = finalAnswers.reduce((total, answer, index) => {
            const question = questions[index];
            const isCorrect = answer === question.answerIndex;
            
            if (question.relatedItemId) {
                questionResults.push({ itemId: question.relatedItemId, correct: isCorrect });
            }

            if (isCorrect) {
                return total + 1;
            } else {
                wrongAnswers.push({
                    question: questions[index].question,
                    userAnswer: answer !== null ? questions[index].options[answer] : "Chưa trả lời",
                    correctAnswer: questions[index].options[questions[index].answerIndex]
                });
                return total;
            }
        }, 0);
        
        setScore(finalScore);
        setShowResult(true);
        onComplete(finalScore, wrongAnswers, questionResults);
        // FIX: Pass questionResults to recordQuizResult
        recordQuizResult(finalScore, questions.length, questionResults);
    };
    
    if (showResult) {
        const xpGained = score * XP_FOR_QUIZ_CORRECT_ANSWER;
        return (
            <div className="text-center glass-card p-6 rounded-xl animate-fade-in">
                <h3 className="text-2xl font-bold font-display text-accent-magenta">{title} - KẾT QUẢ</h3>
                <p className="text-6xl font-bold my-4 text-white">{score} / {questions.length}</p>
                 <div className="flex items-center justify-center text-yellow-300 font-semibold text-lg bg-yellow-400/10 py-2 px-4 rounded-full max-w-xs mx-auto">
                    <BrainCircuitIcon className="w-5 h-5 mr-2"/>
                    <span>+{xpGained} XP</span>
                </div>
                <p className="text-lg text-text-secondary mt-4">AI đang phân tích kết quả của bạn...</p>
            </div>
        );
    }
    
    const question = questions[currentQuestionIndex];
    const selectedAnswer = selectedAnswers[currentQuestionIndex];
    const isAnswered = selectedAnswer !== null;

    return (
        <div className="glass-card p-6 rounded-xl animate-fade-in">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-xl font-semibold font-jp text-text-secondary">{title}</h4>
                <p className="font-mono text-accent-pink">{currentQuestionIndex + 1}/{questions.length}</p>
            </div>
            <div className="w-full bg-border-color h-px mb-6">
                <div className="bg-accent-magenta h-px transition-all duration-300" style={{width: `${(currentQuestionIndex) / questions.length * 100}%`}}></div>
            </div>
            
            <p className="text-lg font-jp mb-6 min-h-[4em] text-text-primary">{question.question}</p>
            <div className="space-y-3">
                {question.options.map((option, index) => {
                    let buttonClass = 'bg-bg-synapse-medium/50 hover:bg-bg-synapse-medium border-border-color';
                    if (isAnswered) {
                        if (index === question.answerIndex) {
                            buttonClass = 'bg-green-500/20 border-green-500 text-green-300 scale-105 transform';
                        } else if (index === selectedAnswer) {
                            buttonClass = 'bg-red-500/20 border-red-500 text-red-400';
                        } else {
                            buttonClass = 'opacity-50';
                        }
                    }
                    
                    return (
                        <button
                            key={index}
                            onClick={() => handleAnswerSelect(index)}
                            disabled={isAnswered}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-300 font-jp ${buttonClass}`}
                        >
                            {`${String.fromCharCode(65 + index)}. ${option}`}
                        </button>
                    );
                })}
            </div>

            {isAnswered && question.explanation && (
                <div className="mt-6 p-3 bg-bg-synapse-medium rounded-lg border border-border-color animate-fade-in">
                    <p className="font-bold text-accent-pink">Giải thích:</p>
                    <p className="text-text-secondary mt-1">{question.explanation}</p>
                </div>
            )}
        </div>
    );
};

export default Quiz;
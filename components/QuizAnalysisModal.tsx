import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { analyzeQuizResults, generateReviewQuiz } from '../services/geminiService';
import type { WrongAnswer } from './Quiz';
import type { AnalysisResult, CustomQuiz } from '../types';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import { BrainCircuitIcon } from './Icons';

interface QuizAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    wrongAnswers: WrongAnswer[];
    onStartReviewQuiz: (quiz: CustomQuiz) => void;
}

const QuizAnalysisModal: React.FC<QuizAnalysisModalProps> = ({ isOpen, onClose, wrongAnswers, onStartReviewQuiz }) => {
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingReview, setIsGeneratingReview] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            setAnalysisResult(null);
            const fetchAnalysis = async () => {
                try {
                    const result = await analyzeQuizResults(wrongAnswers);
                    setAnalysisResult(result);
                } catch (error) {
                    console.error("Failed to get quiz analysis", error);
                    setAnalysisResult({ analysisText: "Đã có lỗi xảy ra khi phân tích kết quả. Vui lòng thử lại sau.", reviewTopics: [] });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAnalysis();
        }
    }, [isOpen, wrongAnswers]);
    
    const handleStartReview = async () => {
        if (!analysisResult || analysisResult.reviewTopics.length === 0) return;
        setIsGeneratingReview(true);
        try {
            const questions = await generateReviewQuiz(analysisResult.reviewTopics);
            onStartReviewQuiz({ title: 'Ôn tập theo Gợi ý', questions });
            onClose(); // Close analysis modal after starting quiz
        } catch (error) {
            console.error("Failed to generate review quiz", error);
            // Optionally show an error to the user
        } finally {
            setIsGeneratingReview(false);
        }
    };
    
    const renderer = new marked.Renderer();
    renderer.link = (href, title, text) => `<a href="${href}" title="${title}" target="_blank" rel="noopener noreferrer" class="text-accent-pink hover:underline">${text}</a>`;
    marked.setOptions({ renderer });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Phân tích Synapse sau Kiểm tra">
            <div className="p-2">
                {isLoading && <LoadingSpinner message="AI đang phân tích..." />}
                {analysisResult && !isLoading && (
                    <div className="animate-fade-in">
                        <div className="prose prose-invert max-w-none prose-p:text-text-secondary prose-strong:text-accent-magenta" 
                             dangerouslySetInnerHTML={{ __html: marked.parse(analysisResult.analysisText) }}>
                        </div>
                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                             <button
                                onClick={onClose}
                                className="w-full px-4 py-3 bg-accent-magenta/80 text-white font-bold rounded-lg hover:bg-accent-magenta transition-colors"
                            >
                                Đã hiểu
                            </button>
                             <button
                                onClick={handleStartReview}
                                disabled={isGeneratingReview || analysisResult.reviewTopics.length === 0}
                                className="w-full px-4 py-3 bg-white/10 text-text-primary font-bold rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <BrainCircuitIcon className="w-5 h-5 mr-2" />
                                {isGeneratingReview ? "Đang tạo..." : "Bắt đầu Ôn tập"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default QuizAnalysisModal;
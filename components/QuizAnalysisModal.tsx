import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { analyzeQuizResults } from '../services/geminiService';
import type { WrongAnswer } from './Quiz';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import { BrainCircuitIcon } from './Icons';

interface QuizAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    wrongAnswers: WrongAnswer[];
}

const QuizAnalysisModal: React.FC<QuizAnalysisModalProps> = ({ isOpen, onClose, wrongAnswers }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            setAnalysis(null);
            const fetchAnalysis = async () => {
                try {
                    const result = await analyzeQuizResults(wrongAnswers);
                    setAnalysis(result);
                } catch (error) {
                    console.error("Failed to get quiz analysis", error);
                    setAnalysis("Đã có lỗi xảy ra khi phân tích kết quả. Vui lòng thử lại sau.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAnalysis();
        }
    }, [isOpen, wrongAnswers]);
    
    const renderer = new marked.Renderer();
    renderer.link = (href, title, text) => `<a href="${href}" title="${title}" target="_blank" rel="noopener noreferrer" class="text-accent-pink hover:underline">${text}</a>`;
    marked.setOptions({ renderer });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Phân tích Synapse sau Kiểm tra">
            <div className="p-2">
                {isLoading && <LoadingSpinner message="AI đang phân tích..." />}
                {analysis && !isLoading && (
                    <div className="animate-fade-in">
                        <div className="prose prose-invert max-w-none prose-p:text-text-secondary prose-strong:text-accent-magenta" 
                             dangerouslySetInnerHTML={{ __html: marked.parse(analysis) }}>
                        </div>
                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                             <button
                                onClick={onClose}
                                className="w-full px-4 py-3 bg-accent-magenta text-white font-bold rounded-lg hover:bg-accent-pink transition-colors"
                            >
                                Đã hiểu
                            </button>
                             <button
                                // TODO: Implement personalized review quiz
                                onClick={onClose}
                                className="w-full px-4 py-3 bg-white/10 text-text-primary font-bold rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
                            >
                                <BrainCircuitIcon className="w-5 h-5 mr-2" />
                                Bắt đầu Ôn tập (Sắp có)
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default QuizAnalysisModal;
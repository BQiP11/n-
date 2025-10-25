import React, { useState, useMemo } from 'react';
import { useProgress } from '../hooks/useProgress';
import { generateReviewQuiz } from '../services/geminiService';
import type { CustomQuiz, LearningItem } from '../types';
import { SparklesIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

interface MemoryStreamProps {
    onStartCustomQuiz: (quiz: CustomQuiz) => void;
}

const MemoryStream: React.FC<MemoryStreamProps> = ({ onStartCustomQuiz }) => {
    const { getMemoryStreamItems } = useProgress([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const reviewItems = useMemo(() => getMemoryStreamItems(), [getMemoryStreamItems]);

    const handleStartReview = async () => {
        if (reviewItems.length === 0) return;
        setIsGenerating(true);
        try {
            // Take first 10 items for the quiz to keep it focused
            const questions = await generateReviewQuiz(reviewItems.slice(0, 10));
            if (questions.length > 0) {
                 onStartCustomQuiz({ title: 'Dòng chảy Trí nhớ', questions });
            }
        } catch (error) {
            console.error("Failed to generate Memory Stream quiz:", error);
        } finally {
            setIsGenerating(false);
        }
    };
    
    if (reviewItems.length === 0) {
        return (
            <div className="mb-8 glass-card p-6 rounded-xl text-center">
                 <h3 className="text-xl font-bold text-green-400 flex items-center justify-center mb-2">
                    <SparklesIcon className="w-6 h-6 mr-2" />
                    Dòng chảy Trí nhớ Trống
                 </h3>
                 <p className="text-text-secondary">Bạn đã ôn tập tất cả kiến thức cần thiết. Làm tốt lắm!</p>
            </div>
        )
    }

    return (
        <div className="mb-8 glass-card p-6 rounded-xl border-l-4 border-yellow-400">
            <h3 className="text-xl font-bold text-yellow-300 flex items-center mb-3">
                <SparklesIcon className="w-6 h-6 mr-2" />
                Dòng chảy Trí nhớ
            </h3>
            <p className="text-text-secondary mb-4">
                Hệ thống nhận thấy bạn có <span className="font-bold text-yellow-300">{reviewItems.length}</span> mục kiến thức cần ôn tập hôm nay để củng cố trí nhớ dài hạn.
            </p>
            <button
                onClick={handleStartReview}
                disabled={isGenerating}
                className="w-full px-6 py-3 bg-yellow-400/20 text-yellow-300 font-bold rounded-lg hover:bg-yellow-400/30 transition-colors flex items-center justify-center disabled:opacity-50"
            >
                {isGenerating ? <LoadingSpinner message="Đang tạo..." /> : `Bắt đầu Ôn tập (${Math.min(10, reviewItems.length)} mục)`}
            </button>
        </div>
    );
};

export default MemoryStream;
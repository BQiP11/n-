
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useProgress } from '../hooks/useProgress';
import { ChartBarIcon, BrainCircuitIcon } from '../components/Icons';
import { renderWithFurigana } from '../components/Modal';
// FIX: Import types and services needed for data fetching
import type { LearningItem, Chapter } from '../types';
import { generateN3Textbook } from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';


const Bar: React.FC<{ percentage: number; color: string }> = ({ percentage, color }) => (
    <div className="w-full bg-bg-synapse-medium rounded-full h-4 border border-border-color">
        <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
        ></div>
    </div>
);


const PerformanceDashboard: React.FC = () => {
    // FIX: Fetch textbook data to provide context for useProgress
    const [textbook, setTextbook] = useState<Chapter[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Data is needed for allItemsMap in useProgress to categorize items
            const data = await generateN3Textbook();
            setTextbook(data);
        } catch (e) {
            console.error("Failed to load textbook for performance dashboard:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const { getPerformanceData } = useProgress(textbook); 
    
    const data = useMemo(() => getPerformanceData(), [getPerformanceData]);

    const renderItem = (item: LearningItem) => {
        if ('word' in item) return <>{renderWithFurigana(item.word)} - {item.meaning_vi}</>;
        if ('grammar' in item) return <>{item.grammar} - {item.meaning_vi}</>;
        if ('kanji' in item) return <>{item.kanji} - {item.meaning_vi}</>;
        return null;
    }
    
    if (isLoading) {
        return <div className="flex justify-center mt-16"><LoadingSpinner message="Đang tải dữ liệu phân tích..." /></div>
    }
    
    return (
        <div className="animate-fade-in">
            <header className="mb-8">
                <h2 className="text-4xl font-bold font-display text-accent-magenta tracking-wide flex items-center">
                    <ChartBarIcon /> <span className="ml-3">PHÂN TÍCH HIỆU SUẤT</span>
                </h2>
                <p className="text-lg text-text-secondary mt-2">Theo dõi tiến trình và xác định điểm yếu của bạn.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 glass-card p-6 rounded-xl">
                    <h3 className="font-bold text-xl mb-4 text-accent-pink">Tổng quan</h3>
                    <div className="flex items-center space-x-6">
                        <div className="relative w-32 h-32">
                             <svg className="w-full h-full" viewBox="0 0 36 36">
                                <path
                                    d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="var(--bg-synapse-medium)"
                                    strokeWidth="3"
                                />
                                <path
                                    d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="var(--accent-magenta)"
                                    strokeWidth="3"
                                    strokeDasharray={`${data.overallAccuracy}, 100`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold">{Math.round(data.overallAccuracy)}%</span>
                                <span className="text-xs text-text-secondary">Chính xác</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-text-primary">
                                AI đã phân tích hiệu suất của bạn dựa trên tất cả các câu trả lời trong các bài kiểm tra và luyện tập.
                                Tỷ lệ chính xác tổng thể cho thấy mức độ hiểu biết chung của bạn về kiến thức N3.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 glass-card p-6 rounded-xl">
                     <h3 className="font-bold text-xl mb-4 text-accent-pink">Hiệu suất theo Kỹ năng</h3>
                     <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-baseline mb-1">
                                <h4 className="font-semibold">Từ vựng</h4>
                                <span className="text-sm font-mono text-text-secondary">{Math.round(data.skillAccuracy.vocabulary)}%</span>
                            </div>
                            <Bar percentage={data.skillAccuracy.vocabulary} color="#f472b6" />
                        </div>
                         <div>
                            <div className="flex justify-between items-baseline mb-1">
                                <h4 className="font-semibold">Ngữ pháp</h4>
                                <span className="text-sm font-mono text-text-secondary">{Math.round(data.skillAccuracy.grammar)}%</span>
                            </div>
                            <Bar percentage={data.skillAccuracy.grammar} color="#ec4899" />
                        </div>
                         <div>
                            <div className="flex justify-between items-baseline mb-1">
                                <h4 className="font-semibold">Kanji</h4>
                                <span className="text-sm font-mono text-text-secondary">{Math.round(data.skillAccuracy.kanji)}%</span>
                            </div>
                            <Bar percentage={data.skillAccuracy.kanji} color="#d946ef" />
                        </div>
                     </div>
                </div>
                 <div className="glass-card p-6 rounded-xl">
                     <h3 className="font-bold text-xl mb-4 text-accent-pink flex items-center"><BrainCircuitIcon className="w-5 h-5 mr-2" /> Vật cản</h3>
                     <p className="text-sm text-text-secondary mb-4">Đây là những kiến thức bạn thường trả lời sai nhất. Hãy tập trung ôn tập!</p>
                     <ul className="space-y-2">
                        {data.weakestItems.map(({item, progress}) => (
                             <li key={item.id} className="p-2 bg-bg-synapse-medium rounded-md text-sm">
                                <p className="font-jp font-semibold text-text-primary">{renderItem(item)}</p>
                                <p className="text-xs text-red-400">Sai: {progress.history.incorrect} lần</p>
                             </li>
                        ))}
                        {data.weakestItems.length === 0 && (
                            <p className="text-sm text-center text-green-400">Không tìm thấy vật cản nào. Làm tốt lắm!</p>
                        )}
                     </ul>
                </div>
            </div>
        </div>
    );
};

export default PerformanceDashboard;
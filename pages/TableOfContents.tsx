import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { generateN3Textbook } from '../services/geminiService';
import type { Chapter, CustomQuiz, LearningItem, ProgressItem } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import XPDisplay from '../components/XPDisplay';
import { useProgress } from '../hooks/useProgress';
import SkillTreeNode from '../components/SkillTreeNode';
import MemoryStream from '../components/MemoryStream';

interface TableOfContentsProps {
    onSelectChapter: (chapter: Chapter) => void;
    onStartCustomQuiz: (quiz: CustomQuiz) => void;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ onSelectChapter, onStartCustomQuiz }) => {
    const [textbook, setTextbook] = useState<Chapter[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const { userProgress, userStats, getChapterProgress, isChapterUnlocked, getProgressItem } = useProgress(textbook || []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await generateN3Textbook();
            setTextbook(data.sort((a,b) => a.chapter - b.chapter));
        } catch (e) {
            setError('Không thể tạo Sơ đồ Tri thức. Vui lòng thử lại.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Only fetch if textbook is not already loaded (e.g. from a cache in a future version)
        if (!textbook) {
            fetchData();
        }
    }, [fetchData, textbook]);
    
    const chapterReviewStatus = useMemo(() => {
        const status: { [key: number]: boolean } = {};
        if (!textbook) return status;
        const now = new Date();
        
        textbook.forEach(chapter => {
            const chapterItems = [...chapter.vocabulary, ...chapter.grammar, ...chapter.kanji];
            status[chapter.chapter] = chapterItems.some(item => {
                const progress = getProgressItem(item.id);
                return new Date(progress.nextReview) <= now && progress.srsLevel > 0;
            });
        });
        return status;
    }, [textbook, getProgressItem]);

    const nodePositions = useMemo(() => {
        if (!textbook) return {};
        const positions: { [key: number]: { x: number, y: number } } = {};
        const nodesPerRow = 3;
        textbook.forEach((chapter, index) => {
            const row = Math.floor(index / nodesPerRow);
            const col = index % nodesPerRow;
            positions[chapter.chapter] = {
                x: col * 200 + 100,
                y: row * 180 + 100
            };
        });
        return positions;
    }, [textbook]);

    const renderKnowledgeMap = () => {
        if (!textbook) return null;

        return (
            <div className="relative min-h-[600px] w-full">
                 <svg className="absolute top-0 left-0 w-full h-full z-0" style={{ transform: 'translate(-5px, -5px)'}}>
                    <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border-color)" />
                        </marker>
                    </defs>
                    {textbook.flatMap(chapter => 
                        (chapter.dependencies || []).map(depId => {
                             const startNode = nodePositions[depId];
                             const endNode = nodePositions[chapter.chapter];
                             if (!startNode || !endNode) return null;
                             return (
                                <line 
                                    key={`${depId}-${chapter.chapter}`}
                                    x1={startNode.x} y1={startNode.y} 
                                    x2={endNode.x} y2={endNode.y} 
                                    stroke="var(--border-color)" 
                                    strokeWidth="2"
                                    markerEnd="url(#arrow)"
                                />
                             )
                        })
                    )}
                </svg>

                {textbook.map((chapter) => {
                    const progress = getChapterProgress(chapter);
                    const unlocked = isChapterUnlocked(chapter);
                    const pos = nodePositions[chapter.chapter];
                    const hasReviewItems = chapterReviewStatus[chapter.chapter] || false;

                    if (!pos) return null;
                    
                    return (
                        <div key={chapter.chapter} className="absolute" style={{ top: `${pos.y}px`, left: `${pos.x}px`, transform: 'translate(-50%, -50%)' }}>
                            <SkillTreeNode
                                chapter={chapter}
                                progressPercentage={progress.percentage * 100}
                                isUnlocked={unlocked}
                                hasReviewItems={hasReviewItems}
                                onClick={unlocked ? () => onSelectChapter(chapter) : undefined}
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="animate-fade-in">
            <header className="mb-8 flex justify-between items-start">
                <div>
                    <h2 className="text-4xl font-bold font-display text-accent-magenta tracking-wide">SƠ ĐỒ TRI THỨC</h2>
                    <p className="text-lg text-text-secondary mt-2">Mở khóa các nút thần kinh để chinh phục N3.</p>
                </div>
                 {userStats.streak > 0 && (
                    <div className="text-center glass-card px-4 py-2 rounded-lg">
                        <p className="font-display text-3xl text-yellow-300">{userStats.streak}</p>
                        <p className="text-xs text-yellow-400 font-semibold">CHUỖI NGÀY</p>
                    </div>
                 )}
            </header>
            
            <div className="mb-8 glass-card p-4 rounded-xl">
                <XPDisplay progress={userProgress} />
            </div>

            {isLoading && <div className="flex justify-center mt-16"><LoadingSpinner message="Đang khởi tạo Sơ đồ Tri thức..." /></div>}
            {error && !isLoading && <ErrorMessage message={error} onRetry={fetchData} />}
            
            {!isLoading && !error && textbook && (
                <>
                    <MemoryStream onStartCustomQuiz={onStartCustomQuiz}/>

                    <div className="mt-8 p-4 glass-card rounded-xl overflow-x-auto">
                        {renderKnowledgeMap()}
                    </div>
                </>
            )}
        </div>
    );
};

export default TableOfContents;
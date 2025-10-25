import React, { useState, useEffect, useCallback } from 'react';
// FIX: Renamed function to match exported member from geminiService
import { generateN3Textbook } from '../services/geminiService';
// FIX: Added Chapter to imports to handle data transformation
import type { VocabularyWord, GrammarPoint, KanjiCharacter, LearningItem, LearningStatus, Chapter } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';
// FIX: Added missing SparklesIcon import
import { CheckCircleIcon, SparklesIcon } from '../components/Icons';
import { useProgress } from '../hooks/useProgress';
import XPDisplay from '../components/XPDisplay';
import Hexagon from '../components/Hexagon';

// Type guards
function isVocabulary(item: LearningItem): item is VocabularyWord { return 'word' in item; }
function isGrammar(item: LearningItem): item is GrammarPoint { return 'grammar' in item; }
function isKanji(item: LearningItem): item is KanjiCharacter { return 'kanji' in item; }

const DetailContent: React.FC<{ item: LearningItem; status: LearningStatus; onUpdateStatus: (newStatus: LearningStatus) => void; }> = ({ item, status, onUpdateStatus }) => {
    // ... Detail content remains largely the same, but interacts with status
    const content = () => {
        if (isVocabulary(item)) {
            return (
                <div className="space-y-4 text-text-primary">
                    <p className="text-sm text-text-secondary">{item.furigana}</p>
                    <h3 className="text-4xl font-bold font-jp">{item.word}</h3>
                    <p className="text-xl font-semibold text-accent-aqua">{item.meaning_vi}</p>
                    <div className="mt-4 p-4 bg-bg-primary rounded-lg border-l-4 border-accent-aqua/50">
                        <p className="font-jp text-text-primary text-lg">{item.example_jp}</p>
                        <p className="text-text-secondary text-sm mt-1">{item.example_en}</p>
                    </div>
                </div>
            );
        }
        if (isGrammar(item)) {
            return (
                 <div className="space-y-4 text-text-primary">
                    <div className="flex items-baseline">
                        <h3 className="text-3xl font-bold font-jp text-accent-aqua">{item.grammar}</h3>
                        <p className="ml-4 text-text-secondary">[{item.formation}]</p>
                    </div>
                    <p className="text-xl font-semibold">{item.meaning_vi}</p>
                     <div className="mt-4 p-4 bg-bg-primary rounded-lg border-l-4 border-accent-aqua/50">
                        <p className="font-jp text-text-primary text-lg">{item.example_jp}</p>
                        <p className="text-text-secondary text-sm mt-1">{item.example_en}</p>
                    </div>
                </div>
            );
        }
        if (isKanji(item)) {
            return (
                <div className="space-y-4 text-text-primary">
                    <h3 className="text-6xl font-bold font-jp text-center mb-4">{item.kanji}</h3>
                    <p className="text-xl font-semibold text-accent-aqua text-center">{item.meaning_vi}</p>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p className="text-sm text-text-secondary">On'yomi</p>
                            <p className="font-jp text-lg">{item.on_yomi}</p>
                        </div>
                        <div>
                            <p className="text-sm text-text-secondary">Kun'yomi</p>
                            <p className="font-jp text-lg">{item.kun_yomi}</p>
                        </div>
                    </div>
                    <div className="pt-4 mt-4 border-t border-border-color">
                        <h4 className="font-bold mb-2">Ví dụ:</h4>
                        <ul className="space-y-3">
                            {item.examples.map((ex, i) => (
                                <li key={i} className="flex items-baseline">
                                    <p className="font-jp text-lg w-1/3">{ex.word}</p>
                                    <p className="text-text-secondary w-1/3">{ex.reading}</p>
                                    <p className="w-1/3">{ex.meaning_vi}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            );
        }
        return null;
    }

    return (
        <div>
            {content()}
            <div className="mt-6 pt-6 border-t border-border-color flex space-x-2">
                <button
                    onClick={() => onUpdateStatus('mastered')}
                    disabled={status === 'mastered'}
                    className="w-full flex items-center justify-center px-4 py-3 font-semibold rounded-lg transition-colors bg-green-500/20 text-green-300 hover:bg-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Đã thành thạo
                </button>
                 <button
                    onClick={() => onUpdateStatus('review')}
                    className="w-full flex items-center justify-center px-4 py-3 font-semibold rounded-lg transition-colors bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/40"
                >
                    Cần ôn tập
                </button>
            </div>
        </div>
    )
}

const Dashboard: React.FC = () => {
    const [curriculum, setCurriculum] = useState<{
        vocabulary: VocabularyWord[];
        grammar: GrammarPoint[];
        kanji: KanjiCharacter[];
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<LearningItem | null>(null);
    // FIX: Pass an empty array to useProgress to satisfy its type signature, resolving the error.
    const { userProgress, getItemStatus, updateItemStatus, getReviewItems } = useProgress([]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // FIX: The service returns chapters, so we need to process the data
            // into the flat structure the dashboard expects.
            const chapters: Chapter[] = await generateN3Textbook();
            const vocabulary = chapters.flatMap(c => c.vocabulary);
            const grammar = chapters.flatMap(c => c.grammar);
            const kanji: KanjiCharacter[] = []; // API doesn't provide Kanji yet, use empty array

            setCurriculum({ vocabulary, grammar, kanji });
        } catch (e) {
            setError('Không thể tải ma trận kiến thức. Vui lòng thử lại.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const renderMatrix = () => {
        if (!curriculum) return null;
        
        // Combine all items for a unified matrix
        const allItems = [...curriculum.vocabulary, ...curriculum.grammar, ...curriculum.kanji];
        
        return allItems.map((item) => {
             let content;
             if (isVocabulary(item)) content = <><p className="text-xs group-hover:text-accent-aqua">{item.furigana}</p><p className="font-jp font-bold text-lg">{item.word}</p></>;
             else if (isGrammar(item)) content = <p className="font-jp font-bold text-base text-center px-2">{item.grammar}</p>;
             else if (isKanji(item)) content = <p className="font-jp font-bold text-3xl">{item.kanji}</p>;

             return (
                <Hexagon 
                    key={item.id} 
                    status={getItemStatus(item.id)}
                    onClick={() => setSelectedItem(item)}
                >
                    {content}
                </Hexagon>
            );
        });
    };
    
    const reviewItems = curriculum ? getReviewItems([...curriculum.vocabulary, ...curriculum.grammar, ...curriculum.kanji]) : [];

    return (
        <div className="animate-fade-in">
            <header className="mb-8">
                <h2 className="text-4xl font-bold font-display text-accent-aqua tracking-wide glint-text">TRUNG TÂM CHỈ HUY</h2>
                <p className="text-lg text-text-secondary mt-2">Giám sát tiến trình và chinh phục ma trận kiến thức N3.</p>
            </header>
            
            <div className="mb-8 glass-card p-4 rounded-xl">
                <XPDisplay progress={userProgress} />
            </div>

            {isLoading && <div className="flex justify-center mt-16"><LoadingSpinner message="Đang khởi tạo ma trận kiến thức..." /></div>}
            {error && !isLoading && <ErrorMessage message={error} onRetry={fetchData} />}
            
            {!isLoading && !error && curriculum && (
                <>
                    {reviewItems.length > 0 && (
                         <div className="mb-8 glass-card p-6 rounded-xl animate-pulse-glow">
                             <h3 className="text-xl font-bold text-yellow-300 flex items-center mb-3">
                                <SparklesIcon className="w-6 h-6 mr-2" />
                                Đề xuất ôn tập
                             </h3>
                             <div className="flex flex-wrap gap-2">
                                 {reviewItems.slice(0, 10).map(item => (
                                     <button key={item.id} onClick={() => setSelectedItem(item)} className="px-3 py-1 bg-yellow-400/10 text-yellow-300 text-sm font-jp rounded-full hover:bg-yellow-400/20">
                                         {item.id}
                                     </button>
                                 ))}
                             </div>
                         </div>
                    )}

                    <div className="p-4 glass-card rounded-xl">
                        <h3 className="text-2xl font-display text-center mb-6">MA TRẬN KIẾN THỨC N3</h3>
                         <div className="flex flex-wrap justify-center gap-1" style={{'--hexagon-size': '100px'} as React.CSSProperties}>
                            {renderMatrix()}
                        </div>
                    </div>
                </>
            )}
            
            <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Phân tích dữ liệu">
                {selectedItem && <DetailContent 
                    item={selectedItem}
                    status={getItemStatus(selectedItem.id)}
                    onUpdateStatus={(newStatus) => {
                        updateItemStatus(selectedItem.id, newStatus);
                    }}
                />}
            </Modal>
        </div>
    );
};

export default Dashboard;
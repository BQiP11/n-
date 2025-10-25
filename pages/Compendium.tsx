
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { generateN3Textbook } from '../services/geminiService';
// FIX: Import CustomQuiz type for props
import type { Chapter, LearningItem, VocabularyWord, GrammarPoint, KanjiCharacter, CustomQuiz } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';
import DetailContent from '../components/DetailContent';
import { BookOpenIcon } from '../components/Icons';

type Tab = 'vocabulary' | 'grammar' | 'kanji';

// Type guards
function isVocabulary(item: LearningItem): item is VocabularyWord { return 'word' in item; }
function isGrammar(item: LearningItem): item is GrammarPoint { return 'grammar' in item; }
function isKanji(item: LearningItem): item is KanjiCharacter { return 'kanji' in item; }


// FIX: Add onStartCustomQuiz to props type to match usage in App.tsx
const Compendium: React.FC<{ openAiHelper: (prompt: string) => void; onStartCustomQuiz: (quiz: CustomQuiz) => void; }> = ({ openAiHelper }) => {
    const [textbook, setTextbook] = useState<Chapter[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('vocabulary');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<LearningItem | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await generateN3Textbook();
            setTextbook(data);
        } catch (e) {
            setError('Không thể tải Kho Dữ liệu. Vui lòng thử lại.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const allItems = useMemo(() => {
        if (!textbook) return { vocabulary: [], grammar: [], kanji: [] };
        return {
            vocabulary: textbook.flatMap(c => c.vocabulary).sort((a,b) => a.furigana.localeCompare(b.furigana, 'ja')),
            grammar: textbook.flatMap(c => c.grammar),
            kanji: textbook.flatMap(c => c.kanji),
        };
    }, [textbook]);

    const filteredItems = useMemo(() => {
        const lowercasedSearch = searchTerm.toLowerCase();
        if (!lowercasedSearch) return allItems[activeTab];

        return allItems[activeTab].filter((item) => {
            if (isVocabulary(item)) {
                return item.word.toLowerCase().includes(lowercasedSearch) ||
                       item.furigana.toLowerCase().includes(lowercasedSearch) ||
                       item.meaning_vi.toLowerCase().includes(lowercasedSearch);
            }
            if (isGrammar(item)) {
                return item.grammar.toLowerCase().includes(lowercasedSearch) ||
                       item.meaning_vi.toLowerCase().includes(lowercasedSearch);
            }
            if (isKanji(item)) {
                return item.kanji.toLowerCase().includes(lowercasedSearch) ||
                       item.meaning_vi.toLowerCase().includes(lowercasedSearch) ||
                       item.on_yomi.toLowerCase().includes(lowercasedSearch) ||
                       item.kun_yomi.toLowerCase().includes(lowercasedSearch);
            }
            return false;
        });
    }, [searchTerm, activeTab, allItems]);

    const renderItemRow = (item: LearningItem) => (
        <button
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="w-full text-left p-3 glass-card rounded-md transition-colors hover:bg-bg-synapse-medium flex justify-between items-center"
        >
            {isVocabulary(item) && <p className="font-jp font-bold text-lg">{item.word} <span className="text-text-secondary font-normal text-base">- {item.meaning_vi}</span></p>}
            {isGrammar(item) && <p className="font-jp font-bold text-lg">{item.grammar} <span className="text-text-secondary font-normal text-base">- {item.meaning_vi}</span></p>}
            {isKanji(item) && <p className="font-jp font-bold text-2xl">{item.kanji} <span className="text-text-secondary font-normal text-base">- {item.meaning_vi}</span></p>}
             <span className="text-xs text-text-secondary/50">Chi tiết</span>
        </button>
    );

    return (
        <div className="animate-fade-in">
            <header className="mb-8">
                <h2 className="text-4xl font-bold font-display text-accent-magenta tracking-wide flex items-center">
                    <BookOpenIcon /> <span className="ml-3">KHO DỮ LIỆU SYNAPSE</span>
                </h2>
                <p className="text-lg text-text-secondary mt-2">Tra cứu toàn bộ kiến thức N3.</p>
            </header>
            
            {isLoading && <div className="flex justify-center mt-16"><LoadingSpinner message="Đang tải kho dữ liệu..." /></div>}
            {error && !isLoading && <ErrorMessage message={error} onRetry={fetchData} />}

            {!isLoading && !error && textbook && (
                <div className="glass-card rounded-xl">
                    <div className="p-4 border-b border-border-color flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex border border-border-color rounded-lg p-1 bg-bg-synapse-deep">
                            {(['vocabulary', 'grammar', 'kanji'] as Tab[]).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tab ? 'bg-accent-magenta/20 text-accent-magenta' : 'text-text-secondary hover:bg-white/5'}`}
                                >
                                    {tab === 'vocabulary' ? 'Từ vựng' : tab === 'grammar' ? 'Ngữ pháp' : 'Kanji'}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={`Tìm kiếm trong ${allItems[activeTab].length} mục...`}
                            className="w-full sm:w-64 px-4 py-2 bg-bg-synapse-medium text-text-primary rounded-lg border border-border-color focus:outline-none focus:ring-1 focus:ring-accent-magenta"
                        />
                    </div>
                    <div className="p-4 h-[60vh] overflow-y-auto">
                        <div className="space-y-2">
                            {filteredItems.map(renderItemRow)}
                        </div>
                    </div>
                </div>
            )}
             <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Phân tích Synapse">
                {selectedItem && <DetailContent item={selectedItem} onAskAi={(prompt) => {
                    setSelectedItem(null);
                    openAiHelper(prompt);
                }}/>}
            </Modal>
        </div>
    );
};

export default Compendium;
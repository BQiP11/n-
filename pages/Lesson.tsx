import React, { useState } from 'react';
import type { Chapter, LearningItem, VocabularyWord, GrammarPoint } from '../types';
import { ChevronLeftIcon, BookOpenIcon, BrainCircuitIcon } from '../components/Icons';
import Modal, { renderWithFurigana } from '../components/Modal';
import Quiz, { WrongAnswer } from '../components/Quiz';
import { useProgress } from '../hooks/useProgress';
import { generateChapterQuiz } from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';
import QuizAnalysisModal from '../components/QuizAnalysisModal';

interface LessonProps {
    chapter: Chapter;
    onExit: () => void;
    openAiHelper: (prompt: string) => void;
}

function isVocabulary(item: LearningItem): item is VocabularyWord { return 'word' in item; }
function isGrammar(item: LearningItem): item is GrammarPoint { return 'grammar' in item; }

const DetailContent: React.FC<{ item: LearningItem; onAskAi: (prompt: string) => void }> = ({ item, onAskAi }) => {
    const createPrompt = () => {
        if (isVocabulary(item)) {
            return `Hãy giải thích chi tiết về từ vựng "${item.word}", cách dùng, và cho tôi thêm 3 ví dụ khác.`;
        }
        if (isGrammar(item)) {
            return `Hãy giải thích sâu hơn về ngữ pháp "${item.grammar}", các trường hợp sử dụng, và cho tôi thêm 3 ví dụ nâng cao.`;
        }
        return '';
    };

    return (
        <div>
            {isVocabulary(item) && (
                <div className="space-y-4 text-text-primary">
                    <p className="text-sm text-text-secondary">{item.furigana}</p>
                    <h3 className="text-4xl font-bold font-jp">{item.word}</h3>
                    <p className="text-xl font-semibold text-accent-magenta">{item.meaning_vi}</p>
                    <div className="mt-4 p-4 bg-bg-synapse-deep rounded-lg border-l-4 border-accent-pink/50">
                        <p className="font-jp text-text-primary text-lg">{renderWithFurigana(item.example_jp)}</p>
                        <p className="text-text-secondary text-sm mt-1">{item.example_en}</p>
                    </div>
                </div>
            )}
            {isGrammar(item) && (
                 <div className="space-y-4 text-text-primary">
                    <div className="flex items-baseline">
                        <h3 className="text-3xl font-bold font-jp text-accent-magenta">{item.grammar}</h3>
                        <p className="ml-4 text-text-secondary">[{item.formation}]</p>
                    </div>
                    <p className="text-xl font-semibold">{item.meaning_vi}</p>
                     <div className="mt-4 p-4 bg-bg-synapse-deep rounded-lg border-l-4 border-accent-pink/50">
                        <p className="font-jp text-text-primary text-lg">{renderWithFurigana(item.example_jp)}</p>
                        <p className="text-text-secondary text-sm mt-1">{item.example_en}</p>
                    </div>
                </div>
            )}
            <button
                onClick={() => onAskAi(createPrompt())}
                className="mt-6 w-full flex items-center justify-center px-4 py-3 font-semibold rounded-lg transition-colors bg-accent-magenta/20 text-accent-magenta hover:bg-accent-magenta/40"
            >
                <BrainCircuitIcon className="w-5 h-5 mr-2" />
                Hỏi Cố vấn Synapse
            </button>
        </div>
    );
};

const Lesson: React.FC<LessonProps> = ({ chapter, onExit, openAiHelper }) => {
    const [selectedItem, setSelectedItem] = useState<LearningItem | null>(null);
    const [view, setView] = useState<'learn' | 'quiz'>('learn');
    const [quizQuestions, setQuizQuestions] = useState<any[] | null>(null);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [analysisData, setAnalysisData] = useState<WrongAnswer[] | null>(null);

    const { getItemStatus, updateItemStatus } = useProgress([chapter]);

    const handleStartQuiz = async () => {
        setIsGeneratingQuiz(true);
        try {
            const questions = await generateChapterQuiz(chapter);
            setQuizQuestions(questions);
            setView('quiz');
        } catch (error) {
            console.error("Failed to generate quiz", error);
        } finally {
            setIsGeneratingQuiz(false);
        }
    };
    
    const handleQuizComplete = (score: number, wrongAnswers: WrongAnswer[]) => {
        [...chapter.vocabulary, ...chapter.grammar].forEach(item => {
            if (getItemStatus(item.id) === 'new') {
                updateItemStatus(item.id, 'learning');
            }
        });

        // Show analysis modal after a short delay
        setTimeout(() => {
            setAnalysisData(wrongAnswers);
        }, 1500);
    }

    const handleCloseAnalysis = () => {
        setAnalysisData(null);
        setView('learn');
    }

    const renderItem = (item: LearningItem) => {
        const status = getItemStatus(item.id);
        const statusColor = {
            new: 'border-border-color',
            learning: 'border-accent-pink/50',
            review: 'border-yellow-400/50',
            mastered: 'border-green-500/50',
        }[status];

        return (
            <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`w-full text-left p-3 glass-card rounded-md border-l-4 transition-colors hover:bg-bg-synapse-medium ${statusColor}`}
            >
                {isVocabulary(item) && <p className="font-jp font-bold text-lg">{item.word} <span className="text-text-secondary font-normal text-base">- {item.meaning_vi}</span></p>}
                {isGrammar(item) && <p className="font-jp font-bold text-lg">{item.grammar} <span className="text-text-secondary font-normal text-base">- {item.meaning_vi}</span></p>}
            </button>
        );
    };

    if (view === 'quiz' && quizQuestions) {
        return (
            <div className="max-w-3xl mx-auto animate-fade-in">
                <Quiz
                    questions={quizQuestions}
                    onComplete={handleQuizComplete}
                    title={`Kiểm tra - Chương ${chapter.chapter}`}
                />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <header className="mb-8">
                <button onClick={onExit} className="flex items-center text-text-secondary hover:text-accent-magenta mb-4">
                    <ChevronLeftIcon />
                    <span className="ml-2 font-semibold">Quay lại Sơ đồ</span>
                </button>
                <p className="font-display text-accent-pink">Chương {chapter.chapter}</p>
                <h2 className="text-4xl font-bold font-display text-accent-magenta tracking-wide">{chapter.title}</h2>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-2xl font-bold mb-4 flex items-center"><BookOpenIcon /> <span className="ml-2">Từ vựng</span></h3>
                    <div className="space-y-3">
                        {chapter.vocabulary.map(renderItem)}
                    </div>
                </div>
                 <div>
                    <h3 className="text-2xl font-bold mb-4 flex items-center"><BrainCircuitIcon /> <span className="ml-2">Ngữ pháp</span></h3>
                    <div className="space-y-3">
                        {chapter.grammar.map(renderItem)}
                    </div>
                </div>
            </div>
            
            <div className="mt-12 pt-8 border-t-2 border-dashed border-border-color text-center">
                <button
                    onClick={handleStartQuiz}
                    disabled={isGeneratingQuiz}
                    className="px-8 py-3 bg-accent-magenta text-white font-bold rounded-lg shadow-lg hover:bg-accent-pink disabled:opacity-50 transition-all text-lg hover:scale-105"
                >
                    {isGeneratingQuiz ? <LoadingSpinner message="Đang tạo..." /> : 'Bắt đầu Kiểm tra'}
                </button>
            </div>
            
            <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Phân tích Synapse">
                {selectedItem && <DetailContent item={selectedItem} onAskAi={(prompt) => {
                    setSelectedItem(null);
                    openAiHelper(prompt);
                }}/>}
            </Modal>
            
            <QuizAnalysisModal 
                isOpen={!!analysisData}
                onClose={handleCloseAnalysis}
                wrongAnswers={analysisData || []}
            />

        </div>
    );
};

export default Lesson;
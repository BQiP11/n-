import React, { useState } from 'react';
import type { LearningItem, VocabularyWord, GrammarPoint, KanjiCharacter } from '../types';
import { renderWithFurigana } from './Modal';
import { BrainCircuitIcon, PlayCircleIcon, AcademicCapIcon, PencilSquareIcon } from './Icons';
import { generateSpeech } from '../services/geminiService';
import ContextualPractice from './ContextualPractice';

// Type guards
function isVocabulary(item: LearningItem): item is VocabularyWord { return 'word' in item; }
function isGrammar(item: LearningItem): item is GrammarPoint { return 'grammar' in item; }
function isKanji(item: LearningItem): item is KanjiCharacter { return 'kanji' in item; }

interface DetailContentProps {
    item: LearningItem;
    onAskAi: (prompt: string) => void;
}

// Helper function to decode base64
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Helper function to decode raw PCM audio data into an AudioBuffer
async function decodePcmAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

const DetailContent: React.FC<DetailContentProps> = ({ item, onAskAi }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'practice'>('details');
    const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);

    const handlePlaySound = async (text: string) => {
        if (isGeneratingSpeech) return;
        setIsGeneratingSpeech(true);
        try {
            const audioBase64 = await generateSpeech(text);
            
            // Correctly handle audio playback using Web Audio API
            // The API returns raw PCM data at 24000Hz, 1 channel
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const decodedBytes = decode(audioBase64);
            const audioBuffer = await decodePcmAudioData(decodedBytes, audioContext, 24000, 1);

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();

        } catch (error) {
            console.error("Failed to generate or play speech:", error);
        } finally {
            setIsGeneratingSpeech(false);
        }
    };

    const createPrompt = () => {
        if (isVocabulary(item)) {
            return `Hãy giải thích chi tiết về từ vựng "${item.word}", cách dùng, và cho tôi thêm 3 ví dụ khác.`;
        }
        if (isGrammar(item)) {
            return `Hãy giải thích sâu hơn về ngữ pháp "${item.grammar}", các trường hợp sử dụng, và cho tôi thêm 3 ví dụ nâng cao.`;
        }
        if (isKanji(item)) {
            return `Hãy giải thích sâu hơn về Kanji "${item.kanji}", các cách đọc phổ biến, và cho tôi ví dụ về các từ ghép thường gặp.`;
        }
        return '';
    };

    const renderDetails = () => {
        if (isVocabulary(item)) {
            return (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                         <h3 className="text-4xl font-bold font-jp">{item.word}</h3>
                         <button
                            onClick={() => handlePlaySound(item.word)}
                            disabled={isGeneratingSpeech}
                            className="text-text-secondary hover:text-accent-magenta transition-colors disabled:opacity-50"
                            aria-label="Play pronunciation"
                        >
                            <PlayCircleIcon className={`w-10 h-10 ${isGeneratingSpeech ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <p className="text-lg text-text-secondary">{item.furigana}</p>
                    <p className="text-xl font-semibold text-accent-magenta">{item.meaning_vi} <span className="text-sm text-text-secondary font-normal ml-2">({item.type})</span></p>
                    <p className="text-text-secondary pt-2">{item.explanation_vi}</p>
                    <div className="mt-4 p-4 bg-bg-synapse-deep rounded-lg border-l-4 border-accent-pink/50">
                        <p className="font-jp text-text-primary text-lg">{renderWithFurigana(item.example_jp)}</p>
                        <p className="text-text-secondary text-sm mt-1">{item.example_en}</p>
                    </div>
                </div>
            );
        }
        if (isGrammar(item)) {
            return (
                 <div className="space-y-4">
                    <h3 className="text-3xl font-bold font-jp text-accent-magenta">{item.grammar}</h3>
                    <p className="text-lg text-text-secondary">[{item.formation}]</p>
                    <p className="text-xl font-semibold">{item.meaning_vi}</p>
                    <p className="text-text-secondary pt-2">{item.explanation_vi}</p>
                     <div className="mt-4 p-4 bg-bg-synapse-deep rounded-lg border-l-4 border-accent-pink/50">
                        <p className="font-jp text-text-primary text-lg">{renderWithFurigana(item.example_jp)}</p>
                        <p className="text-text-secondary text-sm mt-1">{item.example_en}</p>
                    </div>
                </div>
            );
        }
        if (isKanji(item)) {
            return (
                 <div className="space-y-4">
                    <h3 className="text-6xl font-bold font-jp text-center mb-4">{item.kanji}</h3>
                    <p className="text-xl font-semibold text-accent-magenta text-center">{item.meaning_vi}</p>
                     <div className="my-4 p-4 bg-bg-synapse-deep rounded-lg text-center">
                        <p className="text-text-secondary text-sm">{item.mnemonic_vi}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div><p className="text-xs text-text-secondary">On'yomi</p><p className="font-jp text-base">{item.on_yomi}</p></div>
                        <div><p className="text-xs text-text-secondary">Kun'yomi</p><p className="font-jp text-base">{item.kun_yomi}</p></div>
                        <div><p className="text-xs text-text-secondary">Số nét</p><p className="font-jp text-base">{item.stroke_count}</p></div>
                        <div><p className="text-xs text-text-secondary">Bộ thủ</p><p className="font-jp text-base">{item.radical}</p></div>
                    </div>
                    <div className="pt-4 mt-4 border-t border-border-color">
                        <h4 className="font-bold mb-2">Ví dụ:</h4>
                        <ul className="space-y-2">
                            {item.examples.map((ex, i) => (
                                <li key={i} className="flex items-baseline p-2 bg-bg-synapse-deep/50 rounded-md">
                                    <p className="font-jp text-lg w-1/3 font-semibold">{ex.word}</p>
                                    <p className="text-text-secondary w-1/3">{ex.reading}</p>
                                    <p className="w-1/3 text-sm">{ex.meaning_vi}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            <div className="border-b border-border-color mb-4">
                <div className="flex -mb-px">
                    <button onClick={() => setActiveTab('details')} className={`flex items-center px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === 'details' ? 'text-accent-magenta border-accent-magenta' : 'text-text-secondary border-transparent hover:text-white'}`}>
                        <AcademicCapIcon className="w-5 h-5 mr-2" /> Chi tiết
                    </button>
                    <button onClick={() => setActiveTab('practice')} className={`flex items-center px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === 'practice' ? 'text-accent-magenta border-accent-magenta' : 'text-text-secondary border-transparent hover:text-white'}`}>
                        <PencilSquareIcon className="w-5 h-5 mr-2" /> Luyện tập
                    </button>
                </div>
            </div>

            <div className="py-4 min-h-[250px]">
                {activeTab === 'details' && renderDetails()}
                {activeTab === 'practice' && <ContextualPractice item={item} />}
            </div>
            
            <button
                onClick={() => onAskAi(createPrompt())}
                className="mt-4 w-full flex items-center justify-center px-4 py-3 font-semibold rounded-lg transition-colors bg-accent-magenta/20 text-accent-magenta hover:bg-accent-magenta/40"
            >
                <BrainCircuitIcon className="w-5 h-5 mr-2" />
                Hỏi Cố vấn Synapse
            </button>
        </div>
    );
};

export default DetailContent;
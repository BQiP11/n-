import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import { BrainCircuitIcon, XIcon } from './Icons';
import { useChat } from '../hooks/useChat';

interface AIHelperProps {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    contextualPrompt: string;
}

const AIHelper: React.FC<AIHelperProps> = ({ isOpen, onOpen, onClose, contextualPrompt }) => {
    const { messages, input, setInput, isLoading, error, sendMessage, handleFormSubmit, clearMessages } = useChat(
        'You are a friendly and encouraging AI tutor for a Vietnamese person learning Japanese for the JLPT N3 test. Your name is SYNAPSE AI. Your answers should be concise and directly address the user\'s question. Respond in Vietnamese.',
        [{ role: 'model', text: 'Tôi có thể giúp gì cho bạn?' }]
    );
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (contextualPrompt && isOpen) {
            clearMessages();
            sendMessage(contextualPrompt);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextualPrompt, isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const renderer = new marked.Renderer();
    renderer.link = (href, title, text) => `<a href="${href}" title="${title}" target="_blank" rel="noopener noreferrer" class="text-accent-pink hover:underline">${text}</a>`;
    marked.setOptions({ renderer });
    
    if (!isOpen) {
        return (
            <button
                onClick={onOpen}
                className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-accent-magenta text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-40"
                style={{boxShadow: 'var(--accent-glow)'}}
                aria-label="Open AI Helper"
            >
                <BrainCircuitIcon className="w-8 h-8"/>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 bg-black/50 animate-fade-in">
            <div className="glass-card rounded-2xl w-full max-w-md h-[70vh] flex flex-col animate-fade-in-up">
                <header className="flex items-center justify-between p-3 border-b border-border-color">
                    <div className="flex items-center">
                        <BrainCircuitIcon className="w-6 h-6 mr-2 text-accent-magenta"/>
                        <h3 className="font-bold text-lg font-display text-accent-magenta">Cố vấn Synapse</h3>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
                        <XIcon />
                    </button>
                </header>

                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                   {messages.map((msg, index) => (
                        <div key={index} className={`flex gap-2 items-start text-sm ${msg.role === 'user' ? 'justify-end' : ''}`}>
                             {msg.role === 'model' && (
                                <div className="w-6 h-6 rounded-full bg-accent-magenta/20 text-accent-magenta flex items-center justify-center font-bold flex-shrink-0">
                                    <BrainCircuitIcon className="w-4 h-4"/>
                                </div>
                             )}
                            <div className={`rounded-xl p-3 max-w-xs ${msg.role === 'user' ? 'bg-accent-magenta text-white font-semibold rounded-br-none' : 'bg-bg-synapse-medium rounded-bl-none'}`}>
                               <div className="prose prose-sm max-w-none prose-invert prose-p:my-1 prose-p:text-text-primary" dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }}></div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex gap-2">
                             <div className="w-6 h-6 rounded-full bg-accent-magenta/20 flex-shrink-0"></div>
                             <div className="rounded-xl p-3 bg-bg-synapse-medium">
                                <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse [animation-delay:0.2s]"></div>
                             </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                 {error && <p className="text-red-400 text-xs text-center px-4">{error}</p>}
                 <form onSubmit={handleFormSubmit} className="p-3 border-t border-border-color">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isLoading ? "..." : "Hỏi AI..."}
                            disabled={isLoading || !!error}
                            className="w-full pl-4 pr-10 py-2 bg-bg-synapse-medium text-text-primary text-sm rounded-full border border-border-color focus:outline-none focus:ring-1 focus:ring-accent-magenta"
                        />
                        <button type="submit" disabled={isLoading || !input.trim()} className="absolute inset-y-1 right-1 flex items-center justify-center w-7 h-7 text-white bg-accent-magenta rounded-full disabled:bg-slate-500">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009.023 15V5.511l.002.002 4.123 2.356-4.125 1.178z" /></svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AIHelper;

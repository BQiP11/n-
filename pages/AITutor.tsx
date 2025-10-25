import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import { BrainCircuitIcon } from '../components/Icons';
import { useChat } from '../hooks/useChat';

const AITutor: React.FC = () => {
    const { messages, input, setInput, isLoading, error, handleFormSubmit } = useChat(
         'You are a friendly and encouraging AI tutor for a Vietnamese person learning Japanese for the JLPT N3 test. Your name is SYNAPSE AI. Explain concepts clearly, provide useful examples, and keep a positive tone. Respond in Vietnamese unless the user asks for Japanese text.',
         [{
            role: 'model',
            text: 'Xin chào! Tôi là cố vấn AI SYNAPSE. Hãy hỏi tôi bất cứ điều gì để tối ưu hóa quá trình học tiếng Nhật của bạn.',
        }]
    );
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const renderer = new marked.Renderer();
    renderer.link = (href, title, text) => `<a href="${href}" title="${title}" target="_blank" rel="noopener noreferrer" class="text-accent-pink hover:underline">${text}</a>`;
    renderer.code = (code, language) => `<pre><code class="language-${language} bg-bg-synapse-deep p-2 rounded-md block">${code}</code></pre>`;
    marked.setOptions({ renderer });

    return (
        <div className="animate-fade-in h-full flex flex-col max-w-4xl mx-auto">
            <header className="mb-6">
                <h2 className="text-4xl font-bold font-display text-accent-magenta flex items-center tracking-wider">
                    <BrainCircuitIcon className="w-8 h-8 mr-3" />
                    TRỢ GIẢNG AI
                </h2>
                <p className="text-lg text-text-secondary mt-2">Đối tác học tập cá nhân của bạn. Hỏi bất cứ điều gì!</p>
            </header>
            <div className="flex-1 glass-card rounded-2xl p-4 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex gap-3 items-start ${msg.role === 'user' ? 'justify-end' : ''}`}>
                             {msg.role === 'model' && (
                                <div className="w-8 h-8 rounded-full bg-accent-magenta/20 text-accent-magenta flex items-center justify-center font-bold flex-shrink-0" style={{boxShadow: 'var(--accent-glow)'}}>
                                    <BrainCircuitIcon className="w-5 h-5"/>
                                </div>
                             )}
                            <div className={`rounded-2xl p-4 max-w-lg ${msg.role === 'user' ? 'bg-accent-magenta text-white font-semibold rounded-br-none' : 'glass-card bg-bg-synapse-medium/30 rounded-bl-none border-0'}`}>
                               <div className="prose prose-sm max-w-none prose-invert prose-p:text-text-primary prose-strong:text-white" dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }}></div>
                            </div>
                        </div>
                    ))}
                    {isLoading && messages[messages.length-1].role === 'user' && (
                         <div className="flex gap-3">
                             <div className="w-8 h-8 rounded-full bg-accent-magenta/20 text-accent-magenta flex items-center justify-center font-bold flex-shrink-0">
                                <BrainCircuitIcon className="w-5 h-5"/>
                             </div>
                             <div className="rounded-2xl p-4 glass-card bg-bg-synapse-medium/30 rounded-bl-none border-0">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                    <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                </div>
                             </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                 {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
                <form onSubmit={handleFormSubmit} className="mt-4 border-t border-border-color pt-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isLoading ? "AI đang phân tích..." : "Nhập câu hỏi của bạn..."}
                            disabled={isLoading || !!error}
                            className="w-full pl-5 pr-14 py-3 bg-bg-synapse-medium text-text-primary rounded-full border-2 border-border-color focus:outline-none focus:ring-2 focus:ring-accent-magenta focus:border-transparent transition"
                        />
                        <button type="submit" disabled={isLoading || !input.trim()} className="absolute inset-y-1.5 right-1.5 flex items-center justify-center w-10 h-10 text-white bg-accent-magenta rounded-full hover:opacity-90 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009.023 15V5.511l.002.002 4.123 2.356-4.125 1.178z" /></svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AITutor;

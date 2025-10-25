// FIX: import React to get access to React namespace for types like React.FormEvent
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';

interface Message {
    role: 'user' | 'model';
    text: string;
}

export const useChat = (systemInstruction: string, initialMessages: Message[] = []) => {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatRef = useRef<Chat | null>(null);

    useEffect(() => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction },
            });
             setError(null);
        } catch (e) {
            console.error(e);
            setError("Không thể khởi tạo trợ giảng AI. Vui lòng kiểm tra API key và làm mới trang.");
        }
    }, [systemInstruction]);

    const sendMessage = useCallback(async (messageText: string) => {
        if (!messageText.trim() || isLoading || !chatRef.current) return;

        const userMessage: Message = { role: 'user', text: messageText };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            const stream = await chatRef.current.sendMessageStream({ message: messageText });
            
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);
            
            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'model') {
                        lastMessage.text = modelResponse;
                    }
                    return newMessages;
                });
            }
        } catch (err) {
            console.error(err);
            setError("Đã có lỗi xảy ra khi giao tiếp với AI. Vui lòng thử lại.");
            setMessages(prev => {
                // Remove the user message and the empty model message
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.role === 'model' && lastMsg.text === '') {
                     return prev.slice(0, -2);
                }
                return prev;
            });
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendMessage(input);
        setInput('');
    };
    
    const clearMessages = () => {
        setMessages(initialMessages);
    }

    return {
        messages,
        input,
        setInput,
        isLoading,
        error,
        sendMessage,
        handleFormSubmit,
        clearMessages,
    };
};
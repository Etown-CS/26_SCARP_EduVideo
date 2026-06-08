"use client"

import { createContext, useContext, useState, useEffect } from "react";

type Message = {
    sender: string;
    text: string;
};

type ChatContextType = {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
};

const chatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }){
    const [messages, setMessages] = useState<Message[]>(() => {
        if (typeof window !== 'undefined'){
            const saved = localStorage.getItem('chatMessages');
            return saved ? JSON.parse(saved) : [{ sender: 'agent', text: 'How can I help you?'}];
        }
        return [{sender: 'agent', text: 'How can I help you'}];
    });

    useEffect(() => {
        localStorage.setItem('chatMessages', JSON.stringify(messages));
    }, [messages]);

    return(
        <chatContext.Provider value={{ messages, setMessages}}>
            {children}
        </chatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(chatContext);
    if (!context) throw new Error('Cannot use useChat without a ChatProvider');
    return context;
}
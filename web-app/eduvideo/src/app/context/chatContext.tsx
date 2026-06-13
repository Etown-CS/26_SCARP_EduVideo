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
    const [messages, setMessages] = useState<Message[]>([{sender: 'agent', text: 'How can I help you?'}]);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('chatMessages');
        if(saved){
            setMessages(JSON.parse(saved));
        }
        setHydrated(true);
    }, []);

    useEffect(() => {
        if(hydrated){
            localStorage.setItem('chatMessages', JSON.stringify(messages));
        }
    }, [messages, hydrated]);

    
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
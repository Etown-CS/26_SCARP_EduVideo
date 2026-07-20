"use client"

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/firebase/config";

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
        if(typeof window === 'undefined') return [{sender: 'agent', text: 'How can I help you?'}];
        const saved = sessionStorage.getItem('chatMessages');
        return saved ? JSON.parse(saved) : [{sender: 'agent', text: 'How can I help you?'}];
    });

    const previousUser = useRef<string | null | undefined>(undefined);

    useEffect(() => {
        sessionStorage.setItem('chatMessages', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        const signOutUser = onAuthStateChanged(auth, (user) => {
            const wasSignedIn = previousUser.current;
            const uid = user?.uid ?? null;
            if(wasSignedIn && !uid){
                setMessages([{sender: 'agent', text: 'How can I help you?'}]);
                sessionStorage.removeItem('chatMessages');
            }
            previousUser.current = uid;
        });
        return () => signOutUser();
    }, []);
    
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
"use client"

import { createContext, useContext, useState } from "react";

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
    const [messages, setMessages] = useState<Message[]>([
        { sender: "agent", text: "How can I help you?" }
    ]);

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
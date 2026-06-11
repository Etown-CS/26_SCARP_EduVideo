"use client"

import { useEffect, useState } from "react";
import { auth } from "@/app/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import { useChat } from '@/app/context/chatContext';
import { useRouter } from "next/navigation";

export default function AgentChat() {
    const { messages, setMessages } = useChat();
    const [input, setInput] = useState('');
    const [user, loading] = useAuthState(auth);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const username = user?.email ? user.email.split('@')[0] : 'User';

    console.log('messages from context:', messages);
    console.log('user:', user);
    console.log('loading:', loading);

    if (loading) return null;
    if (!user) return;

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        setMessages(prev => [...prev, { sender: 'user', text: input }]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, { sender: 'agent', text: data.reply }]);
            if (data.navigation) {
                router.push(data.navigation.path);
            }
        } finally {
            setIsLoading(false);
        }
    }

    const handleClear = () => {
        setMessages([{ sender: 'agent', text: 'How can I help you?' }]);
    }

    return (
        <div className="self-start">
            <div className="w-96 flex flex-col gap-6 shrink-0">
                <div className="shadow-neomorph-raised bg-surface-container rounded-3xl p-6 h-fit sticky top-24">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-headline text-xl font-bold text-on-surface">Chat</h2>
                        <button
                            onClick={handleClear}
                            className="p-2 bg-primary text-white rounded-lg flex gap-2 items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer">
                            Clear
                        </button>
                    </div>
                    <div className="flex-1 space-y-4 pr-1 max-h-96 overflow-y-auto">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-xl border border-outline-variant/30 ${msg.sender === 'user'
                                    ? 'bg-primary/10 ml-6 text-right'
                                    : 'bg-surface-container-highest/50 mr-6'
                                    }`}
                            >
                                <span className="text-xs font-bold text-on-surface">
                                    {msg.sender === 'user' ? username : 'Video Agent'}
                                </span>
                                <p className="text-sm text-on-surface-variant mt-1 break-words whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="p-3 rounded-xl border border-outline-variant/30 bg-surface-container-highest/50 mr-6">
                                <span className="text-xs font-bold text-on-surface">Video Agent</span>
                                <div className="flex gap-1 mt-4">
                                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-outline-variant/30">
                        <div className="relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                className="w-full shadow-neomorph-sunken bg-surface p-3 rounded-xl text-sm outline-none resize-none h-24 focus:ring-1 ring-primary"
                                placeholder="Write your message here..."
                            />
                        </div>
                        <div className="flex justify-end">
                        <button
                            onClick={handleSend}
                            disabled={isLoading}
                            className="p-2 bg-primary text-white rounded-lg flex gap-2 items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                        >
                            Send<span className="material-symbols-outlined text-sm">Send</span>
                        </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
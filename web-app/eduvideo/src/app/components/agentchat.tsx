"use client"

import { useState } from "react";
import { auth } from "@/app/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import { Agent, run } from '@openai/agents';

export default function AgentChat() {
    const [messages, setMessages] = useState([{ sender: 'agent', text: 'How can I help you?' }]);
    const [input, setInput] = useState('');
    const [user] = useAuthState(auth);

    if(!user) return;

    const username = user?.email ? user.email.split('@')[0] : 'User';

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages(prev => [...prev, { sender: 'user', text: input }]);
        setInput('');
    }

    const handleClear = () => {
        setMessages([{sender: 'agent', text: 'How can I help you?'}]);
    }

    return (
        <div>
            <div className="w-96 flex flex-col gap-6 shrink-0">
                <div className="neomorph-raised bg-surface rounded-3xl p-6 h-fit sticky top-24">
                    <div className="flex items-center justify-between mb-6">
                    <h2 className="font-headline text-xl font-bold text-on-surface">Chat</h2>
                    <button 
                        onClick={handleClear}
                        className="p-2 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all">
                            <span className="material-symbols-outlined text-sm">Clear Messages</span>
                    </button>
                    </div>
                    <div className="flex-1 space-y-4 pr-1">
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
                                className="w-full neomorphic-sunken bg-surface p-3 rounded-xl text-sm outline-none resize-none h-24 focus:ring-1 ring-primary"
                                placeholder="Add timestamped feedback..."
                            />
                        </div>
                        <button
                                onClick={handleSend}
                                className=" bottom-3 right-3 w-16 h-8 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">Send</span>
                            </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
"use client"

import { useState } from "react";

export default function AgentChat() {
    const [messages, setMessages] = useState([{ sender: 'agent', text: 'How can I help you?' }]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages(prev => [...prev, { sender: 'user', text: input }]);
        setInput('');
    }

    return (
        <div>
            <div className="w-96 flex flex-col gap-6 shrink-0">
                <div className="neomorph-raised bg-surface rounded-3xl p-6 h-fit sticky top-24">
                    <div className="flex items-center justify-between mb-6"></div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-xl border border-outline-variant/30 ${msg.sender === 'user'
                                        ? 'bg-primary/10 ml-6'
                                        : 'bg-surface-container-highest/50 mr-6'
                                    }`}
                            >
                                <span className="text-xs font-bold text-on-surface">
                                    {msg.sender === 'user' ? 'You' : 'Video Agent'}
                                </span>
                                <p className="text-sm text-on-surface-variant mt-1">{msg.text}</p>
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
                            <button
                                onClick={handleSend}
                                className="absolute bottom-3 right-3 w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
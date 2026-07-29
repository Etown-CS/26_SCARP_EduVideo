"use client"

import { useEffect, useState, useRef } from "react";
import { auth } from "@/app/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import { useChat } from '@/app/context/chatContext';
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

export default function AgentChat() {
    const { messages, setMessages } = useChat();
    const [input, setInput] = useState('');
    const [user, loading] = useAuthState(auth);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const username = user?.email ? user.email.split('@')[0] : 'User';

    const messageEnd = useRef<HTMLDivElement>(null);

    const pathname = usePathname();
    const [isHidden, setIsHidden] = useState(pathname === '/documents' || pathname === '/gallery');
    const isDocuments = pathname === '/documents';
    const isGallery = pathname === '/gallery';

    {/*
    useEffect(() => {
        if (!user && !loading) {
            setMessages([{ sender: 'agent', text: 'How can I help you?' }]);
        }
    }, [user, loading]);
    */}

    useEffect(() => {
        messageEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages]);

    if (loading) return null;
    if (!user) return;

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        setMessages(prev => [...prev, { sender: 'user', text: input }]);
        setInput('');
        setIsLoading(true);

        try {
            const prompt = localStorage.getItem('selectedPrompt') || '';
            const res = await fetch('/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input, prompt, currentPage: pathname }),
            });
            const data = await res.json();
            try {
                const parsed = JSON.parse(data.reply);
                if (parsed.action === 'update_prompt') {
                    localStorage.setItem('selectedPrompt', parsed.newPrompt);
                    window.dispatchEvent(new StorageEvent('storage', { key: 'selectedPrompt', newValue: parsed.newPrompt }));
                    const activeFileId = localStorage.getItem('activeFileId');
                    if (activeFileId) {
                        const raw = localStorage.getItem('uploadedFiles');
                        const existing = raw ? JSON.parse(raw) : [];
                        const updated = existing.map((f: any) =>
                            f.id === activeFileId ? { ...f, prompt: parsed.newPrompt } : f
                        );
                        localStorage.setItem('uploadedFiles', JSON.stringify(updated));
                    }
                    setMessages(prev => [...prev, { sender: 'agent', text: parsed.message }]);
                    if (parsed.navigateTo) {
                        router.push(parsed.navigateTo);
                    }
                    return;
                }
                if (parsed.action === 'regenerate_video') {
                    const activeFileId = localStorage.getItem('activeFileId');
                    const raw = localStorage.getItem('uploadedFiles');
                    const files = raw ? JSON.parse(raw) : [];
                    const activeFile = files.find((f: any) => f.id === activeFileId);
                    const genRes = await fetch('/api/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: parsed.prompt, document: activeFile, }),
                    });
                    const { jobId } = await genRes.json();
                    localStorage.setItem('currentJobId', jobId);

                    setMessages(prev => [...prev, { sender: 'agent', text: parsed.message }]);
                    router.push('/generate/working');
                    return;
                }
            } catch {

            }
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
        <>
            {(isDocuments || isGallery) && isHidden && (
                <button onClick={() => setIsHidden(prev => !prev)} className="bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 px-4 py-4 hover:brightness-110 active:scale-95 transition-all cursor-pointer" title="Open Chat">
                    <span className="material-symbols-outlined">chat</span>
                </button>
            )}

            {!isHidden && (
                <div className="self-start">
                    <div className="w-96 flex flex-col gap-6 shrink-0">
                        <div className="shadow-neomorph-raised bg-surface-container rounded-3xl p-6 h-fit sticky top-24">
                            <div className="flex items-center justify-between mb-6 pb-3 border-b border-outline-variant/30">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                                        {/*<span className="material-symbols-outlined text-primary">smart_toy</span>*/}
                                        <span><Image src='/Picture1-removebg-preview.png' alt="Blue" width={100} height={100} className="w-auto"></Image></span>
                                    </div>
                                    <h3 className="font-semibold text-on-surface">BluEdu Assistant</h3>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={handleClear}
                                        className="text-outline hover:text-error transition-colors p-1.5 rounded-lg hover:bg-error-container/10 cursor-pointer" title="Clear Chat">
                                        <span className="material-symbols-outlined">delete</span>

                                    </button>
                                    {(isDocuments || isGallery) && (
                                        <button onClick={() => setIsHidden(prev => !prev)} className="text-outline hover:text-on-surface transition-colors p-1.5 rounded-lg hover:bg-surface-variant/50 cursor-pointer" title="Close">
                                            <span className="material-symbols-outlined">close</span>

                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 space-y-4 pr-1 max-h-96 overflow-y-auto scroll-smooth">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${msg.sender === 'user'
                                            ? 'bg-primary/10 border-primary/20'
                                            : 'bg-surface-variant border-primary/20'
                                            }`}>
                                            <span className="material-symbols-outlined text-xs text-primary">{msg.sender === 'user' ? 'person' : 'raven'}</span>
                                        </div>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 border ${msg.sender === 'user'
                                            ? 'bg-primary text-on-primary border-primary/20'
                                            : 'bg-surface border-outline-variant/30'
                                            }`}>
                                            <span className={`text-[12px] font-bold block mb-1 ${msg.sender === 'user' ? 'text-on-primary/70 text-right' : 'text-primary'}`}>
                                                {msg.sender === 'user' ? username : 'Blue'}
                                            </span>
                                            <p className={`text-sm leading-relaxed break-words whitespace-pre-wrap ${msg.sender === 'user' ? 'text-surface' : 'text-on-surface'}`}>{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="p-3 rounded-xl border border-outline-variant/30 bg-surface-container-highest/50 mr-6">
                                        <span className="text-xs font-bold text-on-surface">Blue</span>
                                        <div className="flex gap-1 mt-4">
                                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messageEnd} />
                            </div>

                            <div className="mt-4 pt-4 border-t border-outline-variant/30">
                                <div className="relative">
                                    <label>
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
                                            id="userMessage"
                                            name="userMessage"
                                        />
                                    </label>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleSend}
                                        disabled={isLoading}
                                        className="px-6 py-2 gap-2 bg-primary text-on-primary rounded-lg flex gap-2 items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                                    >
                                        <span>Send</span>
                                        <span className="material-symbols-outlined text-sm">send</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
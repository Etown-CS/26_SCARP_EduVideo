"use client"

import Aside from "@/app/components/aside";
import { auth } from "@/app/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import AgentChat from "@/app/components/agentchat";
import Loading from "@/app/components/loading";
import { useState } from "react";

export default function Edit() {

    const [user, loading] = useAuthState(auth);
    const [newKeyword, setNewKeyword] = useState('');
    const [keyword, setKeyword] = useState<string[]>([]);

    const handleKeyword = () => {
        if (!newKeyword.trim()) return;
        setKeyword(prev => [...prev, newKeyword.trim()]);
        setNewKeyword('');
    };

    if (loading) return (
        <Loading />
    )
    return (
        <main className="flex-grow">
            <section className="relative pt-5 pb-32 px-6 overflow-hidden">
                <div className="flex gap-8 relative z-10 items-start">
                    <Aside />
                    <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden bg-surface rounded-2xl">
                        <div className="flex justify-between items-end">
                            <h1 className="font-headline text-3xl font-bold text-on-background self-start">Edit</h1>
                        </div>
                        <div className="flex-1 grid grid-cols-12 gap-2 min-h-0">
                            <div className="col-span-8 flex flex-col gap-4 min-h-0">
                                <h1 className="font-headline font-bold text-xl text-on-surface mb-2">Keywords</h1>
                                <p className="text-on-surface-variant font-body">Here is where the extracted keywords will go if we want to use that feature.</p>
                                <div className="flex gap-4">
                                    <div className="shadow-neomorph-sunken bg-surface-container px-4 py-2 rounded-xl flex items-center gap-3 w-72">
                                        <input className="bg-transparent border-non focus:ring-0 text-sm font-body w-full" placeholder="Add custom keyword..." type="text" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleKeyword()}></input>
                                        <button onClick={handleKeyword}>
                                            <span className="material-symbols-outlined text-primary">add</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    <div className="shadow-neomorph-raised bg-surface rounded-2xl p-5 border border-white transition-all hover:scale-[1.02] cursor-pointer group">
                                        <div className="flex justify-between items-start mb-4">
                                            <input className="w-5 h-5 rounded text-primary border-outline-variant focus:ring-primary" type="checkbox"></input>
                                            <button className="text-on-surface-variant hover:text-error transition-colors">
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </div>
                                        <h3 className="font-headline text-xl font-bold text-on-surface mb-1">Keyword 1</h3>
                                        <div className="flex items-center gap-2 mb-4">
                                        </div>
                                    </div>
                                    {keyword.map((key, index) => (
                                        <div key={index} className="shadow-neomorph-raised bg-surface rounded-2xl p-5 border border-white transition-all hover:scale-[1.02] cursor-pointer group">
                                            <div className="flex justify-between items-start mb-4">
                                                <input className="w-5 h-5 rounded text-primary border-outline-variant focus:ring-primary" type="checkbox" checked></input>
                                                <button
                                                    onClick={() => setKeyword(prev => prev.filter((_, i) => i !== index))}
                                                    className="text-on-surface-variant hover:text-error transition-colors">
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                </button>
                                            </div>
                                            <h3 className="font-headline text-xl font-bold text-on-surface mb-1">{key}</h3>
                                            <div className="flex items-center gap-2 mb-4">
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-44 shadow-neomorph-raised bg-primary text-on-primary px-6 py-2 rounded-lg items-center gap-2 font-semibold hover:brightness-110 transition-all cursor-pointer">Submit</button>
                            </div>
                            <div className="col-span-4 flex flex-col gap-4 min-h-0">
                                <AgentChat />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
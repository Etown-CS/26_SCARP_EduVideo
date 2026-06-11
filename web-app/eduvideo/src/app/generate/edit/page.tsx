"use client"

import Aside from "@/app/components/aside";
import { auth } from "@/app/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import AgentChat from "@/app/components/agentchat";
import Loading from "@/app/components/loading";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Edit() {

    const [user, loading] = useAuthState(auth);
    const [newKeyword, setNewKeyword] = useState('');
    const [keyword, setKeyword] = useState<string[]>([]);
    const router = useRouter();
    const [prompt, setPrompt] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('prompt') || '';
        }
        return '';
    });
    const inputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [preloaded, setPreloaded] = useState<string | null>(null);



    const handleKeyword = () => {
        if (!newKeyword.trim()) return;
        setKeyword(prev => [...prev, newKeyword.trim()]);
        setNewKeyword('');
    };

    const handleBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selected = Array.from(e.target.files);
            setFiles(prev => [...prev, ...selected]);

            const existing = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
            const name = selected.map(f => ({ name: f.name, prompt: 'N/A' }));
            const merged = [...existing, ...name];
            localStorage.setItem('uploadedFiles', JSON.stringify(merged));
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        const {jobId} = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({document:preloaded || files[0]?.name, prompt}),
        }).then(r => r.json());

        localStorage.setItem('currentJobId', jobId);
        router.push('/generate/working');
    }

    useEffect(() => {
        const saved = localStorage.getItem('selectedDocument');
        if(saved){
            setPreloaded(saved);
            localStorage.removeItem('selectedDocument');
        }
    }, []);
    
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
                                <div className="max-w-2xl shadow-neomorph-sunken bg-surface-container-low my-8 px-4 py-8 rounded-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined text-outline text-[40px]"></span>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="bg-transparent border-none text-sm font-label outline-none placeholder:text-outline w-full resize-none" placeholder="Change your prompt here..." rows={3} />
                                </div>
                                <div className="max-w-2xl max-h-35 border-2 border-dashed border-outline-variant rounded-lg p-12 shadow-neomorph-sunken flex flex-col items-center justify-center gap-4 bg-surface-bright">
                                    <h3 className="font-headline text-xl font-bold text-on-surface">Check or change your files here.</h3>
                                    <button type="button"
                                        onClick={() => inputRef.current?.click()}
                                        className="mt-4 px-8 py-3 bg-outline-variant border border-outline-variant rounded-lg font-semibold text-primary shadow-neomorph-raised hover:bg-surface-container transition-all active:scale-95 cursor-pointer">
                                        Browse Files
                                    </button>
                                    <input ref={inputRef} type="file" multiple className="hidden" onChange={handleBrowse} />
                                </div>
                                {(files.length > 0 || preloaded) && (<div className="mt-4 space-y-2">
                                    {preloaded && (
                                        <div key={preloaded} className="flex items-center justify-between bg-surface-container rounded-lg px-4 py-2 max-w-2xl">
                                            <span className="text-sm text-on-surface truncate">{preloaded}</span>
                                            <button type="button" onClick={() => setPreloaded(null)} className="text-on-surface-variant hover:text-error ml-4 text-xs">Remove</button>
                                        </div>
                                    )}
                                    {files.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between bg-surface-container rounded-lg px-4 py-2 max-w-2xl">
                                            <span className="text-sm text-on-surface truncate">{file.name}</span>
                                            <button type="button" onClick={() => removeFile(index)} className="text-on-surface-variant hover:text-error ml-4 text-xs">Remove</button>
                                        </div>
                                    ))}
                                </div>)
                                }
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
                                    <div className="shadow-neomorph-raised bg-surface rounded-2xl p-5 border border-outline-variant transition-all hover:scale-[1.02] cursor-pointer group">
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
                                        <div key={index} className="shadow-neomorph-raised bg-surface rounded-2xl p-5 border border-outline-variant transition-all hover:scale-[1.02] cursor-pointer group">
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
                                <button onClick={handleSubmit} className="w-44 shadow-neomorph-raised bg-primary text-on-primary px-6 py-2 rounded-lg items-center gap-2 font-semibold hover:brightness-110 transition-all cursor-pointer">Submit</button>
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
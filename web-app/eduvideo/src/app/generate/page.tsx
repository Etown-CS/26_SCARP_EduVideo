"use client"
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from "@/app/firebase/config";
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Aside from '@/app/components/aside';
import AgentChat from '../components/agentchat';
import Loading from "@/app/components/loading";

export default function Generate() {

    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const [prompt, setPrompt] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('prompt') || '';
        }
        return '';
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/sign-in');
        }
    }, [user, router, loading]);

    useEffect(() => {
        localStorage.setItem('prompt', prompt);
    }, [prompt]);

    if (loading) return (
        <Loading />
    );

    if (!user) return null;

    const handleBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selected = Array.from(e.target.files);
            setFiles(prev => [...prev, ...selected]);

            const names = selected.map(f => f.name);
            localStorage.setItem('uploadedFiles', JSON.stringify(names));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = Array.from(e.dataTransfer.files);
        setFiles(prev => [...prev, ...dropped]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        /*
        localStorage.removeItem('prompt');
        localStorage.removeItem('uploadedFiles');
        */
        setPrompt('');
        setFiles([]);
        router.push('/documents');
    }

    return (
        <main className="flex-grow">
            <section className="relative pt-5 pb-32 px-6 overflow-hidden">
                <div className="flex gap-8 relative z-10 items-start">
                    <Aside />
                    <div>
                        <h1 className="font-headline text-3xl font-bold text-on-background">Generate</h1>
                    </div>
                    <div className="flex-1 text-center items-center flex-col pt-20">
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className="max-w-2xl w-full p-2 rounded-xl neomorph-raised bg-surface-container-low group cursor-pointer transition-all duration-300 hover:scale-[1.01]">
                            <div className="border-2 border-dashed border-outline-variant rounded-lg p-12 neomorph-sunken flex flex-col items-center justify-center gap-4 bg-surface-bright">
                                <h3 className="font-headline text-xl font-bold text-on-surface">Upload your files here</h3>
                                <p className="text-on-surface-variant font-body">Support for (needs to be decided)</p>
                                <button type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className="mt-4 px-8 py-3 bg-white border border-outline-variant rounded-lg font-semibold text-primary neomorph-raised hover:bg-surface-container transition-all active:scale-95">
                                    Browse Files
                                </button>
                                <input ref={inputRef} type="file" multiple className="hidden" onChange={handleBrowse} />
                            </div>
                            {files.length > 0 && (<div className="mt-4 space-y-2">
                                {files.map((file, index) => (<div key={index} className="flex items-center justify-between bg-surface-container rounded-lg px-4 py-2">
                                    <span className="text-sm text-on-surface truncate">{file.name}</span>
                                    <button type="button" onClick={() => removeFile(index)} className="text-on-surface-variant hover:text-error ml-4 text-xs">Remove</button>
                                </div>))
                                }
                            </div>)
                            }
                        </div>
                        <div className="max-w-2xl neomorph-sunken bg-surface-container-low my-8 px-4 py-8 rounded-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-outline text-[40px]"></span>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="bg-transparent border-none text-sm font-label outline-none placeholder:text-outline w-full resize-none" placeholder="Input an additional prompt here" rows={3} />
                        </div>
                        <div className="max-w-2xl flex flex-col items-center justify-center gap-4">
                            <button
                                onClick={handleSubmit}
                                className="mt-4 px-8 py-3 bg-primary border border-outline-variant rounded-lg font-semibold text-white neomorph-raised hover:brightness-110 transition-all active:scale-95 justify-center">
                                Submit
                            </button>
                        </div>
                    </div>
                    <AgentChat />
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-full -z-10 opacity-40 pointer-events-none">
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-fixed-dim rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-secondary-fixed rounded-full blur-[80px]"></div>
                </div>
            </section>
        </main>
    )
}
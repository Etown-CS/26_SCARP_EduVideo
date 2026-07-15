"use client"
import Aside from "@/app/components/aside";
import { auth } from "@/app/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import AgentChat from "@/app/components/agentchat";
import Loading from "@/app/components/loading";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/app/firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { cleanupAbandoned, clearPipelineState } from "@/app/lib/pipelineState";

export default function Edit() {

    const [user, loading] = useAuthState(auth);
    const [isDragging, setIsDragging] = useState(false);
    const router = useRouter();
    const [prompt, setPrompt] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [preloaded, setPreloaded] = useState<string | null>(null);
    const [preloadedId, setPreloadedId] = useState<string | null>(null);
    const [fileIds, setFileIds] = useState<string[]>([]);
    const allowedTypes = ['.pdf', '.docx', '.md'];
    const allowedMimeTypes = ['application/pdf', 'text/markdown', 'text/x-markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const [fileError, setFileError] = useState<string | null>(null);

    function isAllowed(file: File): boolean {
        const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        const extOk = allowedTypes.includes(ext);
        const mimeOk = file.type === '' || allowedMimeTypes.includes(file.type);
        return extOk && mimeOk;
    }

    const processFiles = (incoming: File[]) => {
        if (incoming.length === 0) return;
        const valid = incoming.filter(isAllowed);
        if (valid.length === 0) {
            setFileError('Only PDF, DOCX, and MD files can be uploaded at this time. Please try uploading a document in that format');
            return;
        }
        if (incoming.length > 1) {
            setFileError('Only one file can be uploaded at a time. The first valid file will be used');
        } else {
            setFileError(null);
        }
        const selectedFile = valid[0];
        setFiles([selectedFile]);
        setFileIds([`${selectedFile.name}-${Date.now()}-${Math.random()}`]);
    }

    const handleBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(Array.from(e.target.files));
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
        processFiles(Array.from(e.dataTransfer.files));
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        const { jobId } = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document: preloaded || files[0]?.name, prompt }),
        }).then(r => r.json());
        localStorage.setItem('currentJobId', jobId);
        router.push('/generate/working');
    }

    const handleAbandon = async () => {
        const confirmed = window.confirm(
            "Starting over will erase your video's current progress. Do you want to continue?"
        );
        if (confirmed) {
            await cleanupAbandoned(user);
            clearPipelineState();
            router.push("/generate");
        }
    };

    useEffect(() => {
        const saved = localStorage.getItem('selectedDocument');
        if (saved) {
            setPreloaded(saved);
            localStorage.removeItem('selectedDocument');
        }
        const savedPrompt = localStorage.getItem('selectedPrompt');
        if (savedPrompt && savedPrompt !== 'N/A') {
            setPrompt(savedPrompt);
        }
        const activeFileId = localStorage.getItem('activeFileId');
        if (activeFileId) {
            setPreloadedId(activeFileId);
        }

    }, []);

    useEffect(() => {
        if (!prompt) return;
        const activeFileId = localStorage.getItem('activeFileId');
        localStorage.setItem('selectedPrompt', prompt);
        if (activeFileId && user) {
            updateDoc(doc(db, 'users', user.uid, 'files', activeFileId), {
                prompt: prompt || 'N/A'
            }).catch(console.error);
        }
    }, [prompt]);


    useEffect(() => {
        const handleStorageChange = () => {
            const updated = localStorage.getItem('selectedPrompt');
            if (updated && updated !== 'N/A') {
                setPrompt(updated);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
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
                            <button onClick={handleAbandon} className="shadow-neomorph-raised bg-surface-container-low px-4 py-2 rounded-lg flex items-center gap-2 text-on-surface-variant font-md hover:translate-y-[-1px] transition-all cursor-pointer">
                                <span className="material-symbols-outlined">delete_forever</span>
                                Start Over
                            </button>
                        </div>
                        <div className="flex-1 grid grid-cols-12 gap-2 min-h-0">
                            <div className="col-span-8 flex flex-col gap-4 min-h-0">
                                <p className="mt-2 max-w-2xl text-sm text-on-surface-variant font-body leading-relaxed">If you would like your video to include something it didn't or remove a topic, consider adding or changing the prompt. If you ask the chat to generate a new prompt, make sure to add a space at the end so it saves, otherwise the new prompt will not work.</p>
                                <div className="max-w-2xl shadow-neomorph-sunken bg-surface-container-low my-4 px-4 py-8 rounded-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined text-outline text-[40px]"></span>
                                    <label className="w-full">
                                        <textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            className="bg-transparent border-none text-sm font-label outline-none placeholder:text-outline w-full resize-none justify-center" placeholder="Change your prompt here..." rows={5}
                                            name="promptEditor" id="promptEditor" />
                                    </label>
                                </div>
                                <div className="max-w-2xl max-h-35 border-2 border-dashed border-outline-variant rounded-lg p-12 shadow-neomorph-sunken flex flex-col items-center justify-center gap-4 bg-surface-bright">
                                    <h3 className="font-headline text-xl font-bold text-on-surface">Check or change your files here.</h3>
                                    <button type="button"
                                        onClick={() => inputRef.current?.click()}
                                        className="mt-4 px-8 py-3 border border-outline-variant rounded-lg font-semibold text-primary shadow-neomorph-raised hover:bg-surface-container transition-all active:scale-95 cursor-pointer">
                                        Browse Files
                                    </button>
                                    <input ref={inputRef} type="file" accept=".pdf,.docx,.md" className="hidden" onChange={handleBrowse} />
                                    {fileError && (
                                        <p className="text-sm text-error mt-2">{fileError}</p>
                                    )}
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
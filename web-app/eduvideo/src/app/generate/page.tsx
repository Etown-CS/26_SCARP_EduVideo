"use client"
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from "@/app/firebase/config";
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Aside from '@/app/components/aside';
import AgentChat from '../components/agentchat';
import Loading from "@/app/components/loading";
import { storage } from "@/app/firebase/config";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export default function Generate() {

    //create necessary variables
    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const [prompt, setPrompt] = useState('');
    const [preloaded, setPreloaded] = useState<string | null>(null);
    const [preloadedId, setPreloadedId] = useState<string | null>(null);
    const [fileIds, setFileIds] = useState<string[]>([]);
    const allowedTypes = ['.pdf', '.docx', '.md'];
    const allowedMimeTypes = ['application/pdf', 'text/markdown', 'text/x-markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',];

    //check if file is allowed
    function isAllowed(file: File): boolean {
        const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        const extOk = allowedTypes.includes(ext);
        const mimeOk = file.type === '' || allowedMimeTypes.includes(file.type);
        return extOk && mimeOk;
    }

    //handles processing to eliminate repetative code but hasn't been implemented yet
    const processFiles = (incoming: File[]) => {
        if (incoming.length === 0) return;
        const valid = incoming.filter(isAllowed);
        if (valid.length === 0) return;
        if (incoming.length > 1 || valid.length > 1) {
            //setError('Only one file can be uploaded at a time.');
        }
        const selectedFile = valid[0];
        setFiles([selectedFile]);
        const raw = localStorage.getItem('uploadedFiles');
        const existing = raw && raw !== 'undefined' ? JSON.parse(raw) : [];
        const entry = {
            id: `${selectedFile.name}-${Date.now()}-${Math.random()}`,
            name: selectedFile.name,
            prompt: 'N/A',
            date: new Date().toLocaleDateString(),
        };
        localStorage.setItem('activeFileId', entry.id);
        setFileIds([entry.id]);
        localStorage.setItem('uploadedFiles', JSON.stringify([...existing, entry]));
    };

    //This function calls the generate video API as well as establishing the metadata scheme for the generate video.
    const handleGenerate = async () => {
        //At some point this will need to be updated to include the actual document content
        const { jobId } = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document: preloaded || files[0]?.name, prompt }),
        }).then(r => r.json());

        //set create and set initial values for the video metadata
        const metadata = {
            title: preloaded || files[0]?.name || 'Untitled',
            topic: 'Unknown',
            prompt: prompt,
            description: 'None',
            length: 'Unknown',
            date: new Date().toISOString(),
            document: preloaded || files[0]?.name || 'N/A'
        };

        //add everything to localStorage so it can be accessed across different pages.
        localStorage.setItem('selectedDocument', preloaded || files[0]?.name || '');
        localStorage.setItem('currentJobId', jobId);
        localStorage.setItem('videoMetadata', JSON.stringify(metadata));
        router.push('/generate/working');
    };

    //ensures that the user is logged in and the page is not still loading. If the user is not signed in, they will get pushed to the sign in page.
    useEffect(() => {
        if (!loading && !user) {
            router.push('/sign-in');
        }
    }, [user, router, loading]);

    //loads all of the preloaded information from storage on page mount.
    useEffect(() => {
        const saved = localStorage.getItem('selectedDocument');
        if (saved) {
            setPreloaded(saved);
            localStorage.removeItem('selectedDocument');
        }
        const savedPrompt = localStorage.getItem('selectedPrompt');
        if (savedPrompt && savedPrompt !== 'N/A') {
            setPrompt(savedPrompt);
            //localStorage.removeItem('selectedPrompt');
        }
        const activeFileId = localStorage.getItem('activeFileId');
        if (activeFileId) {
            setPreloadedId(activeFileId);
        }
    }, []);

    //will refresh and save the prompt back to storage when it is updated
    useEffect(() => {
        const activeFileId = localStorage.getItem('activeFileId');
        localStorage.setItem('selectedPrompt', prompt);
        if (activeFileId) {
            const raw = localStorage.getItem('uploadedFiles');
            const existing = raw ? JSON.parse(raw) : [];
            const updated = existing.map((f: any) => f.id === activeFileId ? { ...f, prompt } : f);
            localStorage.setItem('uploadedFiles', JSON.stringify(updated));
        }
    }, [prompt]);

    //Event listener for storage. 
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

    //show loading wheel if page is still loading
    if (loading) return (
        <Loading />
    );

    //Ensures that nothing loads when there is no user logged in
    if (!user) return null;

    //allows the user to browse and select files to upload
    const handleBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selected = Array.from(e.target.files);
            setFiles(prev => [...prev, ...selected]);

            const raw = localStorage.getItem('uploadedFiles');
            const existing = raw && raw !== 'undefined' ? JSON.parse(raw) : [];

            const entry = selected.map(f => ({
                id: `${f.name}-${Date.now()}-${Math.random()}`,
                name: f.name,
                prompt: 'N/A',
                date: new Date().toLocaleDateString()
            }));
            localStorage.setItem("activeFileId", entry[0].id);
            setFileIds(prev => [...prev, ...entry.map(e => e.id)]);
            const merged = [...existing, ...entry];
            localStorage.setItem('uploadedFiles', JSON.stringify(merged));
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
        if (dropped.length === 0) return;
        setFiles(prev => [...prev, ...dropped]);
        const raw = localStorage.getItem('uploadedFiles');
        const existing = raw && raw !== 'undefined' ? JSON.parse(raw) : [];

        const entry = dropped.map(f => ({
            id: `${f.name}-${Date.now()}-${Math.random()}`,
            name: f.name,
            prompt: 'N/A',
            date: new Date().toLocaleDateString()
        }));
        localStorage.setItem("activeFileId", entry[0].id);
        setFileIds(prev => [...prev, ...entry.map(e => e.id)]);
        const merged = [...existing, ...entry];
        localStorage.setItem('uploadedFiles', JSON.stringify(merged));
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    //Old function. Still here for when I want to test something with a document I know I am going to delete and don't want to waste my writes to the db on.
    const handleSubmit = () => {
        const raw = localStorage.getItem('uploadedFiles');
        const existing = raw && raw !== 'undefined' ? JSON.parse(raw) : [];
        const hasFile = !!(preloaded || files[0]);

        let updated;
        if (hasFile) {
            updated = existing.map((entry: { id: string; name: string; prompt?: string }) => {
                if (entry.id === preloadedId) {
                    return { ...entry, prompt: prompt || 'N/A' };
                }
                if (fileIds.includes(entry.id)) {
                    return { ...entry, prompt: prompt || 'N/A' };
                }
                return entry;
            });
        } else {
            const newEntry = {
                id: `prompt-only-${Date.now()}`,
                name: 'N/A',
                prompt: prompt,
                date: new Date().toLocaleDateString(),
            };
            updated = [...existing, newEntry];
        }
        localStorage.setItem('uploadedFiles', JSON.stringify(updated));
        handleGenerate();
    }

    //handles storing the document contents in firestore while storing everything else locally
    const handleSend = async () => {
        if (!user) return;
        const existing = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
        const updated = existing.map((entry: { id: string; name: string; prompt?: string }) => {
            if (entry.id === preloadedId) return { ...entry, prompt: prompt || 'N/A' };
            if (fileIds.includes(entry.id)) return { ...entry, prompt: prompt || 'N/A' };
            return entry;
        });
        localStorage.setItem('uploadedFiles', JSON.stringify(updated));
        let documentContent: string | null = null;
        if (files.length > 0) {
            const fileContentMap: Record<string, string> = {};
            await Promise.all(
                files.map(
                    (file) =>
                        new Promise<void>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                fileContentMap[file.name] = e.target?.result as string;
                                resolve();
                            };
                            reader.onerror = () => reject(reader.error);
                            reader.readAsDataURL(file);
                        })
                )
            );
            await Promise.all(
                updated.filter((entry: any) => fileContentMap[entry.name]).map((entry: any) => setDoc(doc(storage, "documentContents", entry.id), {
                    userId: user.uid,
                    name: entry.name,
                    content: fileContentMap[entry.name],
                    updatedAt: serverTimestamp(),
                }))
            );
            const active = updated.find((e: any) => fileIds.includes(e.id));
            if (active) documentContent = fileContentMap[active.name] ?? null;
        } else if (preloadedId) {
            try {
                const snap = await getDoc(doc(storage, "documentContents", preloadedId));
                if (snap.exists()) {
                    documentContent = snap.data().content;
                } else {
                    console.warn('No stored content found for', preloadedId);
                }
            } catch (err) {
                console.error('Failed to fetch existing document contents: ', err);
            }
        }
        handleGenerate();
    };

    //handles uploading the document contents to firestore and saving the prompt, document name, etc. It is the same as handleSend, just without the video generation at the end.
    const handleSave = async () => {
        const raw = localStorage.getItem('uploadedFiles');
        const existing = raw && raw !== 'undefined' ? JSON.parse(raw) : [];
        const hasFile = !!(preloaded || files[0]);

        let updated;
        if (hasFile) {
            updated = existing.map((entry: { id: string; name: string; prompt?: string }) => {
                if (entry.id === preloadedId) {
                    return { ...entry, prompt: prompt || 'N/A' };
                }
                if (fileIds.includes(entry.id)) {
                    return { ...entry, prompt: prompt || 'N/A' };
                }
                return entry;
            });
        } else {
            const newEntry = {
                id: `prompt-only-${Date.now()}`,
                name: 'N/A',
                prompt: prompt,
                date: new Date().toLocaleDateString(),
            };
            updated = [...existing, newEntry];
        }
        localStorage.setItem('uploadedFiles', JSON.stringify(updated));

        if (files.length > 0) {
            const fileContentMap: Record<string, string> = {};
            await Promise.all(
                files.map(
                    (file) =>
                        new Promise<void>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                fileContentMap[file.name] = e.target?.result as string;
                                resolve();
                            };
                            reader.onerror = () => reject(reader.error);
                            reader.readAsDataURL(file);
                        })
                )
            );

            await Promise.all(
                updated.filter((entry: any) => fileContentMap[entry.name]).map((entry: any) => setDoc(doc(storage, "documentContents", entry.id), {
                    userId: user.uid,
                    name: entry.name,
                    content: fileContentMap[entry.name],
                    updatedAt: serverTimestamp(),
                }))
            );
        }
        localStorage.removeItem('activeFileId');
        localStorage.removeItem('selectedPrompt');
        router.push('/documents');
    }

    return (
        <main className="flex-grow">
            <section className="relative pt-5 pb-32 px-6 overflow-hidden">
                <div className="flex gap-8 relative z-10 items-start">
                    <Aside />
                    <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden bg-surface rounded-2xl">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="font-headline text-3xl font-bold text-on-background">Generate</h1>
                            </div>
                        </div>
                        <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                            <div className="col-span-8 flex flex-col gap-2 min-h-0">
                                <p className="mt-6 max-w-3xl text-sm text-on-surface-variant font-body mb-8 leading-relaxed">Use the box below to upload your notes, powerpoints, coding samples, etc. You can drag and drop or use the browse files button.</p>
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className="max-w-3xl w-full p-2 rounded-xl shadow-neomorph-raised bg-surface-container-low group cursor-pointer transition-all duration-300 hover:scale-[1.01]">
                                    <div className="border-2 border-dashed border-outline-variant rounded-lg p-12 shadow-neomorph-sunken flex flex-col items-center justify-center gap-4 bg-surface-bright">
                                        <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center mb-2">
                                            <span className="material-symbols-outlined text-primary text-4xl">cloud_upload</span>
                                        </div>
                                        <h3 className="font-headline text-xl font-bold text-on-surface">Upload your files here</h3>
                                        <p className="text-on-surface-variant font-body">Support for docx, pdf, and md</p>
                                        <button type="button"
                                            onClick={() => inputRef.current?.click()}
                                            className="mt-4 px-8 py-3 bg-surface border border-outline-variant rounded-lg font-semibold text-primary shadow-neomorph-raised hover:bg-surface-container transition-all active:scale-95 cursor-pointer">
                                            Browse Files
                                        </button>
                                        <input ref={inputRef} type="file" multiple className="hidden" onChange={handleBrowse} />
                                    </div>
                                    {(files.length > 0 || preloaded) && (<div className="mt-4 space-y-2">
                                        {preloaded && (
                                            <div key={preloaded} className="flex items-center justify-between bg-surface-container rounded-lg px-4 py-2">
                                                <span className="text-sm text-on-surface truncate">{preloaded}</span>
                                                <button type="button" onClick={() => setPreloaded(null)} className="text-on-surface-variant hover:text-error ml-4 text-xs">Remove</button>
                                            </div>
                                        )}
                                        {files.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between bg-surface-container rounded-lg px-4 py-2">
                                                <span className="text-sm text-on-surface truncate">{file.name}</span>
                                                <button type="button" onClick={() => removeFile(index)} className="text-on-surface-variant hover:text-error ml-4 text-xs">Remove</button>
                                            </div>
                                        ))}
                                    </div>)
                                    }
                                </div>
                                <p className="mt-6 max-w-3xl text-sm text-on-surface-variant font-body leading-relaxed">If you would like to have your video be more specific to a certain concept, consider entering a prompt into the box below. If you are unsure how to word your prompt, ask the chat and it will generate a prompt for you to use.</p>
                                <div className="max-w-3xl shadow-neomorph-sunken bg-surface-container-low my-8 px-4 py-4 rounded-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined text-outline text-[40px]"></span>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="bg-transparent border-none text-sm font-label outline-none placeholder:text-outline w-full resize-none" placeholder="Input an additional prompt here" rows={5} />
                                </div>
                                <div className="max-w-3xl flex items-center gap-4 justify-center mt-4">
                                    <button
                                        onClick={handleSend}
                                        className="w-40 px-4 py-3 bg-primary border border-outline-variant rounded-lg font-semibold text-surface shadow-neomorph-raised hover:brightness-110 transition-all active:scale-95 justify-center cursor-pointer">
                                        Generate
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="w-40 px-4 py-3 bg-secondary border border-outline-variant rounded-lg font-semibold text-white shadow-neomorph-raised hover:brightness-110 transition-all active:scale-95 justify-center cursor-pointer">
                                        Save
                                    </button>
                                </div>
                            </div>
                            <AgentChat />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
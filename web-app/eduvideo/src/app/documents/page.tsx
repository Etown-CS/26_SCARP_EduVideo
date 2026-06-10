"use client"
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/app/components/loading";
import AgentChat from "../components/agentchat";

export default function Docs() {

    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    const [fileNames, setFileNames] = useState<{ name: string, prompt: string }[]>([]);


    useEffect(() => {
        if (!user && !loading) {
            router.push('/sign-in');
        }
    }, [user, router, loading]);

    useEffect(() => {
        const raw = localStorage.getItem('uploadedFiles');
        console.log('raw:', raw);
        const stored = JSON.parse(raw || '[]');
        console.log('stored:', stored);
        const normalized = stored.map((entry: string | { name: string; prompt: string }) =>
            typeof entry === 'string' ? { name: entry, prompt: 'N/A' } : entry
        );
        console.log('normalized:', normalized);
        setFileNames(normalized);
    }, []);

    const handleDelete = (name: string) => {
        const updated = fileNames.filter(f => f.name !== name);
        setFileNames(updated);
        localStorage.setItem('uploadedFiles', JSON.stringify(updated));
    }

    if (loading) return (
        <Loading />
    );


    if (!user) return null;
    return (
        <main className="flex-grow">
            <section className="relative pt-5 pb-32 px-6 overflow-hidden">
                <div className="px-4 md:px-8 py-6">
                    <h1 className="font-headline text-3xl font-bold text-on-background">My Documents</h1>
                    <div className="flex flex-row items-start gap-8 mt-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {fileNames.length > 0 ? (
                                fileNames.map((file, index) => (
                                    <div key={`${file.name}-${index}`} className="file-card bg-surface rounded-xl p-6 shadow-neomorph-raised border border-white/50 flex flex-col h-full">
                                        <div className="flex items-start justify-between mb-6">
                                            <span className="font-label text-[12px] text-outline bg-surface-container px-2 py-1 rounded">{file.name?.split('.').pop()?.toUpperCase()}</span>
                                        </div>
                                        <h3 className="font-headline text-lg font-semibold text-on-background mb-2">{file.name}</h3>
                                        <p className="text-on-surface-variant text-md mb-6 flex items-center gap-2">Prompt: {file.prompt}</p>
                                        <p className="text-on-surface-variant text-sm mb-6 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                            Uploaded {new Date().toLocaleDateString()}
                                        </p>
                                        <div className="mt-auto pt-6 border-t border-surface-variant flex gap-3">
                                            <button onClick={() => {
                                                localStorage.setItem('selectedDocument', file.name);
                                                localStorage.setItem('selectedPrompt', file.prompt);
                                                router.push('/generate');
                                            }}
                                                className="flex-1 bg-primary-container text-on-primary-container py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer">
                                                <span className="material-symbols-outlined text-[18px]">movie_edit</span>
                                                Generate Video
                                            </button>
                                            <button onClick={() => handleDelete(file.name)}
                                                className="p-1 bg-error/10 text-on-surface-variant hover:text-error rounded-lg transition-all cursor-pointer">
                                                <span className="text-sm">Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div>
                                    <p className="text-on-surface-variant font-body px-4"> No documents </p>
                                </div>
                            )}
                            <div onClick={() => router.push('/generate')} className="bg-surface-container-low rounded-xl p-6 shadown-neomorph-sunken border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-center group cursor-pointer hoer:border-primary transition-colors">
                                <div className="p-4 bg-surface rounded-full shadow-neomorph-raised mb-4 group-hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[40px]">upload_file</span>
                                </div>
                                <p className="font-headline font-semibold text-on-surface group-hover:text-primary transition-colors">Go to Document Uploads</p>
                            </div>
                        </div>
                        <AgentChat />
                    </div>
                </div>
            </section>
        </main>
    )
}
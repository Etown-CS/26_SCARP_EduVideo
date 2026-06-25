"use client"
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/app/components/loading";
import AgentChat from "../components/agentchat";
import { usePathname } from "next/navigation";

export default function Docs() {

    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    const [fileNames, setFileNames] = useState<{ id: string, name: string, prompt: string, date?: string }[]>([]);
    const pathname = usePathname();
    const [viewing, setviewing] = useState<typeof fileNames[0] | null>(null);

    useEffect(() => {
        if (!user && !loading) {
            router.push('/sign-in');
        }
    }, [user, router, loading]);

    useEffect(() => {
        const raw = localStorage.getItem('uploadedFiles');
        const stored = JSON.parse(raw || '[]');
        const normalized = stored.map((entry: any) =>
            typeof entry === 'string'
                ? { id: `${entry}-${Date.now()}`, name: entry, prompt: 'N/A', date: 'Unknown' }
                : entry);
        setFileNames(normalized);
    }, [pathname]);

    const handleDelete = (id: string) => {
        const updated = fileNames.filter(f => f.id !== id);
        setFileNames(updated);
        localStorage.setItem('uploadedFiles', JSON.stringify(updated));
    }

    const getIcon = (filename: string) => {
        const ex = filename?.split('.').pop()?.toLowerCase();

        switch (ex) {
            case 'pdf':
                return { icon: 'picture_as_pdf' };
            case 'docx':
                return { icon: 'description' };
            case 'md':
            case 'markdown':
                return { icon: 'markdown' };
            default:
                return { icon: 'insert_drive_file' };
        }
    };

    if (loading) return (
        <Loading />
    );


    if (!user) return null;
    return (
        <main className="flex-grow">
            <section className="relative pt-5 pb-32 px-6 overflow-hidden">
                <div className="px-4 md:px-8 py-6">
                    <h1 className="font-headline text-3xl font-bold text-on-background">My Documents</h1>
                    <p className="mt-3 max-w-3xl text-md text-on-surface-variant font-body leading-relaxed">Here is where your uploaded documents and prompts are stored.</p>
                    <div className="flex flex-row items-start gap-8 mt-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {fileNames.length > 0 ? (
                                fileNames.map((file, index) => (
                                    <div key={file.id} className="file-card bg-surface rounded-xl p-6 shadow-neomorph-raised border border-outline-variant/30 flex flex-col h-full">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[20px]">{getIcon(file.name).icon}</span>
                                            <span className="font-label text-[12px] text-outline bg-surface-container px-2 py-1 rounded">{file.name?.split('.').pop()?.toUpperCase()}</span>
                                            </div>
                                            <button onClick={() => handleDelete(file.id)}
                                                className="text-on-surface-variant hover:text-error rounded-lg transition-all cursor-pointer">
                                                <span className="text-sm material-symbols-outlined">close</span>
                                            </button>
                                        </div>
                                        <h3 className="font-headline text-lg font-semibold text-on-background mb-2">{file.name}</h3>
                                        <p className="text-on-surface-variant text-md mb-6 gap-2 overflow-y-auto max-h-50"> Prompt: {file.prompt} </p>
                                        
                                        <p className="text-on-surface-variant text-sm mt-6 mb-6 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                            Uploaded: {file.date || 'Unknown'}
                                        </p>
                                        <button onClick={() => setviewing(file)}
                                            className="bg-secondary-container text-on-secondary-container py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer mb-4">
                                            <span className="material-symbols-outlined">document_search</span>View Document
                                        </button>
                                        <div className="mt-auto pt-4 border-t border-surface-variant flex gap-3">
                                            <button onClick={() => {
                                                localStorage.setItem('activeFileId', file.id);
                                                localStorage.setItem('selectedDocument', file.name);
                                                localStorage.setItem('selectedPrompt', file.prompt);
                                                router.push('/generate');
                                            }}
                                                className="flex-1 bg-primary-container text-on-primary-container py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer">
                                                <span className="material-symbols-outlined text-[18px]">movie_edit</span>
                                                Generate Video
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
            {viewing && (
                <div onClick={() => setviewing(null)}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-on-background/40 backdrop-blur-sm">
                    <div onClick={(e) => e.stopPropagation()}
                        className="bg-surface w-full max-w-5xl h-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden shadow-neomorph-raised">
                        <div className="px-6 py-4 border-b border-surface-variant flex items-center justify-between bg-surface">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-error/10 text-error rounded-lg">
                                    <span className="material-symbols-outlined text-sm">{getIcon(viewing.name).icon}</span>
                                </div>
                                <h2 className="font-headline font-bold text-on-background text-lg">{viewing.name}</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setviewing(null)}
                                    className="p-2 hover:bg-red-50 hhover:text-red-500 rounded-lg text-outline transition-colors cursor-pointer">
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto bg-surface-container-low p-8 md:p-12">
                            <div className="max-w-3xl mx-auto bg-surface-container shadow-lg p-12 min-h-full font-body text-on-surface-variant leading-relaxed">
                                <h1 className="text-2xl font-bold text-on-background mb-8">Temporary Document Placeholder</h1>
                                <h1 className="text-2xl font-bold text-on-background mb-8">Technical Specification: Video Synthesis Engine v4.2</h1>
                                <section className="mb-8">
                                    <h2 className="text-lg font-semibold text-primary mb-4">1. Executive Summary</h2>
                                    <p className="mb-4">This document outlines the architectural framework for the BluEdu video synthesis pipeline, focusing on the automated conversion of technical documentation into structured educational video content.</p>
                                </section>
                                <section className="mb-8">
                                    <h2 className="text-lg font-semibold text-primary mb-4">2. System Architecture</h2>
                                    <p className="mb-4">The engine utilizes a multi-stage processing model:</p>
                                </section>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-surface-variant bg-surface flex justify-between items-center">
                            <span className="text-xs text-outline font-label">Page 1 of ?</span>
                            <div className="flex gap-2">
                                <button onClick={() => {
                                    localStorage.setItem('activeFileId', viewing.id);
                                    localStorage.setItem('selectedDocument', viewing.name);
                                    localStorage.setItem('selectedPrompt', viewing.prompt);
                                    router.push('/generate');
                                }}
                                    className="bg-primary text-on-primary px-6 py-2 rounded-lg font-bold text-sm shadow-lg hover:bg-primary-container transition-all cursor-pointer">Generate Video from this Doc
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
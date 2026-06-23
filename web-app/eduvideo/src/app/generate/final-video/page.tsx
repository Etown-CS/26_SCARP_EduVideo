"use client"

import Aside from "@/app/components/aside";
import { auth } from "@/app/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState } from "react";
import Loading from "@/app/components/loading";
import AgentChat from "@/app/components/agentchat";
import { useRouter } from "next/navigation";

export default function FinalVideo() {

    const [user, loading] = useAuthState(auth);
    const [title, setTitle] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('title') || '';
        }
        return '';
    });
    const [desc, setDesc] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('desc') || '';
        }
        return '';
    });

    const router = useRouter();
    const [newTag, setNewTag] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoMetadata, setVideoMetadata] = useState<{
        title: '',
        topic: '',
        prompt: string,
        description: '',
        length: string,
        date: string,
        document: string
    } | null>(null);

    useEffect(() => {
        const url = localStorage.getItem('completedVideoUrl');
        if (url) setVideoUrl(url);
    }, []);

    const handleNewTag = () => {
        if (!newTag.trim()) return;
        setTags(prev => [...prev, newTag.trim()]);
        setNewTag('');
    };

    const handleSave = () => {
        const metadata = {
            title,
            description: desc,
            date: new Date().toISOString(),
            document: localStorage.getItem('selectedDocument') || 'N/A',
            prompt: localStorage.getItem('prompt') || 'N/A',
        };
        localStorage.setItem('videoMetadata', JSON.stringify(metadata));
    };

    const handleReset = () => {
        localStorage.removeItem('videoMetadata');
        localStorage.removeItem('completedVideoUrl');
        localStorage.removeItem('prompt');
        localStorage.removeItem('selectedPrompt');
        localStorage.removeItem('activeFileId');
        localStorage.removeItem('selectedDocument');
        localStorage.removeItem('title');
        localStorage.removeItem('desc');
        router.push('/documents');
    }

    useEffect(() => {
        const saved = localStorage.getItem('videoMetadata');
        if (saved) {
            const meta = JSON.parse(saved);
            if (meta.title) setTitle(meta.title?.split('.')[0]);
            if (meta.description) setDesc(meta.description);
            if (meta.tags) setTags(meta.tags);
        }
    }, []);

    if (loading) return (
        <Loading />
    );

    return (
        <main className="flex-grow">
            <section className="relative pt-5 pb-32 px-6 overflow-hidden">
                <div className="flex gap-8 relative z-10 items-start">
                    <Aside />
                    <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden bg-surface-container-low rounded-2xl">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="font-headline text-3xl font-bold text-on-background self-start mb-6">Final Video</h1>
                            </div>
                        </div>
                        <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                            <div className="col-span-8 flex flex-col gap-6 min-h-0">
                                {/*
                                <div className="shadow-neomorph-raised bg-surface rounded-3xl p-16 overflow-hidden">
                                    <div className="aspect-video bg-inverse-surface rounded-2xl overflow-hidden shadow-inner">
                                        <iframe width="560" height="315" src="https://www.youtube.com/embed/OnYSjEehxH0?si=gECZ-dlfw6SXL68j" title="YouTube video player" allowFullScreen className="w-full h-full"></iframe>
                                    </div>
                                    <div className="flex justify-between items-center mt-4 px-2">
                                        <div className="flex items-center gap-4 text-on-surface-variant">
                                            <span className="font-label text-sm">sample video from firebase</span>
                                        </div>
                                    </div>
                                </div>
                                */}
                                {videoUrl && (
                                    <video src={videoUrl} controls className="w-full h-115 rounded-xl mt-4" />
                                )}
                                <div className="col-span-4 flex flex-col gap-6 min-h-0">
                                    <div className="shadow-neomorph-raised bg-surface rounded-3xl p-6 h-fit sticky top-24">
                                        <h2 className="font-headline text-xl font-bold text-on-surface">Set video information</h2>
                                        <div className="space-y-6">
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">Title</label>
                                                    <div className="shadow-neomorph-sunken bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                                                        <textarea
                                                            value={title}
                                                            onChange={(e) => setTitle(e.target.value)}
                                                            className="w-full p-3 rounded-xl text-sm outline-none focus:ring-1 ring-primary" placeholder="Title"></textarea>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">Description</label>
                                                    <div className="shadow-neomorph-sunken bg-surface-container-low p-4 rounded-xl">
                                                        <textarea
                                                            value={desc}
                                                            onChange={(e) => setDesc(e.target.value)}
                                                            className="w-full p-3 rounded-xl text-sm outline-none focus:ring-1 ring-primary" placeholder="Description">
                                                        </textarea>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">Tags</label>
                                                    <div>
                                                        {tags.map((tag, index) => (
                                                            <span key={index}
                                                                className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-label"
                                                            >{tag}</span>
                                                        ))}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2 mb-2">
                                                        <input
                                                            value={newTag}
                                                            onChange={(e) => setNewTag(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    handleNewTag();
                                                                }
                                                            }}
                                                            className="bg-surface-container-low border border-outline-variant rounded-full px-1 p-1 text-xs outline-none focus:ring-1 ring-primary"
                                                            placeholder="New tag"
                                                        />
                                                        <button
                                                            onClick={handleNewTag}
                                                            className="bg-primary text-on-primary px-3 py-1 rounded-full text-xs shadow-neomorph-raised hover:brightness-110 transition-all active:scale-95">
                                                            Add tag
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-6 border-t border-outline-variant/30 max-w-2xl flex items-center gap-40 justify-center">
                                                <button onClick={handleReset} className="bg-secondary text-on-primary px-5 py-1 rounded-full text-md shadow-neomorph-raised hover:brightness-110 transition-all active:scale-95">Reset</button>
                                                <button onClick={handleSave} className="bg-primary text-on-primary px-5 py-1 rounded-full text-md shadow-neomorph-raised hover:brightness-110 transition-all active:scale-95">Save</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-4 flex flex-col gap-6 min-h-0">
                                <AgentChat />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
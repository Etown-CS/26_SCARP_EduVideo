"use client"
import Aside from "@/app/components/aside";
import { auth } from "@/app/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState } from "react";
import Loading from "@/app/components/loading";
import AgentChat from "@/app/components/agentchat";
import { useRouter } from "next/navigation";
import { db } from "@/app/firebase/config";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { cleanupAbandoned, clearPipelineState } from "@/app/lib/pipelineState";

export default function FinalVideo() {

    const [user, loading] = useAuthState(auth);
    const [title, setTitle] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('title') || '';
        }
        return '';
    });
    const [topic, setTopic] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('topic') || '';
        }
        return '';
    });
    const [prompt] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('prompt') || localStorage.getItem('selectedPrompt') || '';
        }
        return '';
    });
    const [desc, setDesc] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('desc') || '';
        }
        return '';
    });
    const [documentName, setDocName] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('selectedDocument') || 'N/A';
        }
        return 'N/A';
    });

    const router = useRouter();
    const [newTag, setNewTag] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoMetadata, setVideoMetadata] = useState<{
        title: string;
        topic: string;
        prompt: string;
        description: string;
        length: string;
        videoUrl: string;
        date: string;
        document: string;
        tags: string[];
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

    const handleSave = async () => {
        if (!videoUrl) return;
        if (!user) return;
        const docId = localStorage.getItem('videoDocId');
        if (!docId) {
            console.error('No video id found. No metadata saved to database.');
            return;
        }
        const metadata = {
            title,
            topic: topic || 'N/A',
            prompt: prompt || 'N/A',
            description: desc,
            length: 'Unknown',
            videoUrl: videoUrl || '',
            date: new Date().toISOString(),
            document: documentName || 'N/A',
            tags,
            status: 'complete',
            updatedAt: serverTimestamp(),
        };
        try {
            await updateDoc(doc(db, 'users', user.uid, 'videos', docId), metadata);
        } catch (err) {
            console.error('Failed to updated video metadata: ', err);
            return;
        }
        localStorage.setItem('videoMetadata', JSON.stringify(metadata));
        setVideoMetadata(metadata);
        clearPipelineState();
        router.push('/documents');
    };

    const handleAbandon = async () => {
        const confirmed = window.confirm(
            "Starting over will erase your video's current progress. Do you want to continue?"
        );
        if (confirmed) {
            await cleanupAbandoned(user);
            clearPipelineState();
            router.push('/documents');
        }
    };

    useEffect(() => {
        const saved = localStorage.getItem('videoMetadata');
        if (saved) {
            const meta = JSON.parse(saved);
            if (meta.title) setTitle(meta.title?.split('.')[0]);
            if (meta.topic) setTopic(meta.topic);
            if (meta.description) setDesc(meta.description);
            if (meta.document) setDocName(meta.document);
            if (meta.videoUrl) setVideoUrl(meta.videoUrl);
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
                    <div className="flex-1 flex flex-col p-6 gap-2 overflow-hidden bg-surface-container-low rounded-2xl">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="font-headline text-3xl font-bold text-on-background self-start mb-2">Final Video</h1>
                                <p> Your video is complete and ready for viewing!</p>
                            </div>
                        </div>
                        <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                            <div className="col-span-8 flex flex-col gap-6 min-h-0">
                                <div className="shadow-neomorph-raised bg-surface rounded-3xl p-8 overflow-hidden">
                                    <div className="aspect-video bg-inverse-surface rounded-2xl overflow-hidden shadow-inner">
                                        {videoUrl && (
                                            <video src={videoUrl} controls className="w-full h-full rounded-xl object-contain" />
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-4 flex flex-col gap-6 min-h-0">
                                    <div className="shadow-neomorph-raised bg-surface rounded-3xl p-6 h-fit">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="font-headline text-2xl font-bold text-on-surface">Set video information</h2>
                                        </div>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-on-surface-variant uppercase mb-2 font-bold text-md flex items-center gap-1">Title <span className="material-symbols-outlined text-xs">edit</span></label>
                                                <div className="shadow-neomorph-sunken bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                                                    <textarea
                                                        value={title}
                                                        onChange={(e) => setTitle(e.target.value)}
                                                        className="w-full p-3 rounded-xl text-sm outline-none focus:ring-1 ring-primary" placeholder="Title" name="videoTitle" id="videoTitle"></textarea>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-on-surface-variant uppercase mb-2 font-bold text-md flex items-center gap-1">Topic <span className="material-symbols-outlined text-xs">edit</span></label>
                                                <div className="shadow-neomorph-sunken bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                                                    <textarea value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full p-3 rounded-xl text-sm outline-none focus:ring-1 ring-primary" placeholder="Topic" name="videoTopic" id="videoTopic"></textarea>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-on-surface-variant uppercase block mb-2 font-bold text-md">Prompt</label>
                                                <div className="shadow-neomorph-sunken bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                                                    <p className="w-full p-3 text-sm text-on-surface-variant whitespace-pre-wrap">{prompt || 'No prompt set'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-on-surface-variant uppercase mb-2 font-bold text-md flex items-center gap-1">Description <span className="material-symbols-outlined text-xs">edit</span></label>
                                                <div className="shadow-neomorph-sunken bg-surface-container-low p-4 rounded-xl">
                                                    <textarea
                                                        value={desc}
                                                        onChange={(e) => setDesc(e.target.value)}
                                                        className="w-full p-3 rounded-xl text-sm outline-none focus:ring-1 ring-primary" placeholder="Description" name="description" id="description">
                                                    </textarea>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-md text-on-surface-variant uppercase block mb-2 font-bold">Document</label>
                                                <div className="shadow-neomorph-sunken bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                                                    <p className="w-full p-3 text-sm text-on-surface-variant whitespace-pre-wrap">{documentName || 'No document selected'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-md text-on-surface-variant uppercase block mb-2 font-bold">Tags</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {tags.map((tag, index) => (
                                                        <span key={index}
                                                            className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-sm font-label flex items-center gap-1"
                                                        >{tag}
                                                            <button onClick={() => setTags(prev => prev.filter((_, i) => i !== index))} className="text-on-secondary-container/70 hover:text-error cursor-pointer inline-flex items-center justify-center leading-none p-0 border-0 bg-transparent">
                                                                <span className="material-symbols-outlined text-[14px] leading-none">close</span>
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 mb-2">
                                                    <label>
                                                        <input
                                                            value={newTag}
                                                            onChange={(e) => setNewTag(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    handleNewTag();
                                                                }
                                                            }}
                                                            className="bg-surface-container-low border border-outline-variant rounded-full px-1 p-1 text-sm outline-none focus:ring-1 ring-primary"
                                                            placeholder="New tag" name="tags" id="tags"
                                                        />
                                                    </label>
                                                    <button
                                                        onClick={handleNewTag}
                                                        className="bg-primary text-on-primary px-3 py-1 rounded-full text-sm shadow-neomorph-raised hover:brightness-110 transition-all active:scale-95">
                                                        Add tag
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-6 border-t border-outline-variant/30 max-w-2xl flex items-center gap-40 justify-center">
                                            <button onClick={handleSave} className="bg-primary text-on-primary px-5 py-1 rounded-full text-md shadow-neomorph-raised hover:brightness-110 transition-all active:scale-95">Save</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-4 flex flex-col gap-6 min-h-0">
                                <AgentChat />
                                <div className="shadow-neomorph-raised bg-primary/10 rounded-3xl p-6 h-fit">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="font-headline text-2xl font-bold text-on-surface">Additional Resources</h2>
                                    </div>
                                    <p>Agent can add extra links and things here. Essentially this section will help the user to view other, non-AI resources.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
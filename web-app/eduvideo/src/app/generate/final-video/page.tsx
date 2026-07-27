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
    const [topics, setTopics] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('topics');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });
    const [newTopic, setNewTopic] = useState('');
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
    const [resources, setResources] = useState<{ title: string; url: string; description: string }[]>([]);
    const [resourcesLoading, setResourcesLoading] = useState(false);
    const [resourcesError, setResourcesError] = useState<string | null>(null);

    const router = useRouter();
    const [newTag, setNewTag] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [videoMetadata, setVideoMetadata] = useState<{
        title: string;
        topics: string[];
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

    useEffect(() => {
        if (topics.length === 0) return;
        const controller = new AbortController();
        const fetchResources = async () => {
            setResourcesLoading(true);
            setResourcesError(null);
            try {
                const res = await fetch('/api/resources', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: topics.join(', '), prompt }),
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error('Failed to fetch additional resources');
                const data = await res.json();
                setResources(data.reply?.resources ?? []);
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    console.error('Failed to fetch additional resources: ', err);
                    setResourcesError('Could not load additional resources');
                }
            } finally {
                setResourcesLoading(false);
            }
        };
        fetchResources();
        return () => controller.abort();
    }, [topics, prompt]);


    const handleNewTag = () => {
        if (!newTag.trim()) return;
        setTags(prev => [...prev, newTag.trim()]);
        setNewTag('');
    };

    const handleNewTopic = () => {
        if (!newTopic.trim()) return;
        setTopics(prev => [...prev, newTopic.trim()]);
        setNewTopic('');
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
            topics: topics.length ? topics : ['N/A'],
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

    const handleDownload = async () => {
        if (!videoUrl) return;
        setDownloading(true);
        try {
            const res = await fetch(videoUrl);
            if (!res.ok) throw new Error("Failed to fetch video.");
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = `${title || "video"}.mp4`;
            a.click();
            a.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Failed to download video: ", err);
        } finally {
            setDownloading(false);
        }
    }

    useEffect(() => {
        const saved = localStorage.getItem('videoMetadata');
        if (saved) {
            const meta = JSON.parse(saved);
            if (meta.title) setTitle(meta.title?.split('.')[0]);
            if (meta.topics) setTopics(meta.topics);
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
                                        <p className="mt-6 max-w-3xl text-sm text-on-surface-variant font-body mb-8 leading-relaxed">
                                            If you would like, you can edit the title, subject/topic, and description to better describe your video. You can also add tags to help describe the contents of your video. Once the information is to your liking, you can save the video to your gallery.
                                        </p>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-on-surface-variant uppercase mb-2 font-bold text-md flex items-center gap-1">Title <span className="material-symbols-outlined text-xs">edit</span></label>
                                                <p className="max-w-3xl text-sm text-on-surface-variant font-body mb-8 leading-relaxed">Edit the title of your video here!</p>
                                                <div className="shadow-neomorph-sunken bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                                                    <textarea
                                                        value={title}
                                                        onChange={(e) => setTitle(e.target.value)}
                                                        className="w-full p-3 rounded-xl text-sm outline-none focus:ring-1 ring-primary" placeholder="Title" name="videoTitle" id="videoTitle"></textarea>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-on-surface-variant uppercase mb-2 font-bold text-md flex items-center gap-1">Topic <span className="material-symbols-outlined text-xs">edit</span></label>
                                                <p className="max-w-3xl text-sm text-on-surface-variant font-body mb-8 leading-relaxed">View the topics used to generate your video! If you feel something is missing, add another topic for your own reference. Topics are also used to find additional resources so editing them will adjust the resource picks.</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {topics.map((topic, index) => (
                                                        <span key={index} className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-sm font-label flex items-center gap-1">
                                                            {topic}
                                                            <button onClick={() => setTopics(prev => prev.filter((_, i) => i !== index))} className="text-on-secondary-container/70 hover:text-error cursor-pointer inline-flex items-center justify-center leading-none p-0 border-0 bg-transparent">
                                                                <span className="material-symbols-outlined text-[14px] leading-none">close</span>
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 mb-2">
                                                    <input
                                                        value={newTopic}
                                                        onChange={(e) => setNewTopic(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleNewTopic();
                                                            }
                                                        }}
                                                        className="bg-surface-container-low border border-outline-variant rounded-full px-1 p-1 text-sm outline-none focus:ring-1 ring-primary"
                                                        placeholder="New topic" name="topics" id="topics"
                                                    />
                                                    <button
                                                        onClick={handleNewTopic}
                                                        className="bg-primary text-on-primary px-3 py-1 rounded-full text-sm shadow-neomorph-raised hover:brightness-110 transition-all active:scale-95">
                                                        Add topic
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-on-surface-variant uppercase mb-2 font-bold text-md flex items-center gap-1">Description <span className="material-symbols-outlined text-xs">edit</span></label>
                                                <p className="max-w-3xl text-sm text-on-surface-variant font-body mb-8 leading-relaxed">Describe your video here.</p>
                                                <div className="shadow-neomorph-sunken bg-surface-container-low p-4 rounded-xl">
                                                    <textarea
                                                        value={desc}
                                                        onChange={(e) => setDesc(e.target.value)}
                                                        className="w-full p-3 rounded-xl text-sm outline-none focus:ring-1 ring-primary" placeholder="Description" name="description" id="description">
                                                    </textarea>
                                                </div>
                                            </div>
                                            {/*
                                            <div>
                                                <label className="text-on-surface-variant uppercase block mb-2 font-bold text-md">Prompt</label>
                                                <div className="shadow-neomorph-sunken bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                                                    <p className="w-full p-3 text-sm text-on-surface-variant whitespace-pre-wrap">{prompt || 'No prompt set'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-md text-on-surface-variant uppercase block mb-2 font-bold">Document</label>
                                                <div className="shadow-neomorph-sunken bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                                                    <p className="w-full p-3 text-sm text-on-surface-variant whitespace-pre-wrap">{documentName || 'No document selected'}</p>
                                                </div>
                                            </div>
                                            */}
                                            <div>
                                                <label className="text-md text-on-surface-variant uppercase block mb-2 font-bold">Tags</label>
                                                <p className="max-w-3xl text-sm text-on-surface-variant font-body mb-8 leading-relaxed">Add any additional descriptors you want, such as class, difficulty level, professor, etc.</p>
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
                                        <div className="pt-6 flex items-center gap-40 justify-center">
                                            <button onClick={handleSave} className="w-50 bg-primary text-on-primary py-3 px-5 rounded-lg font-bold text-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer mb-4">Save</button>
                                        </div>
                                        {/*
                                        <div className="flex justify-center">
                                            //Doesn't actually download anything yet because there is nothing to download
                                            <button className="w-50 bg-secondary text-on-secondary py-3 px-5 rounded-lg font-bold text-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer mb-4">
                                                <span className="material-symbols-outlined text-md">download</span>Download Video
                                            </button>
                                        </div>
                                        */}
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-4 flex flex-col gap-6 min-h-0">
                                <AgentChat />
                                <div className="shadow-neomorph-raised bg-primary/10 rounded-3xl p-6 h-fit">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="font-headline text-2xl font-bold text-on-surface">Additional Resources</h2>
                                    </div>
                                    {resourcesLoading && (
                                        <p className="text-sm text-on-surface-variant">Finding resources...</p>
                                    )}
                                    {resourcesError && (
                                        <p className="text-sm text-on-surface-variant">{resourcesError}</p>
                                    )}
                                    {!resourcesLoading && !resourcesError && resources.length === 0 && (
                                        <p className="text-sm text-on-surface-variant">No resources found yet.</p>
                                    )}
                                    <ul className="space-y-3">
                                        {resources.map((r, i) => (
                                            <li key={i}>
                                                <a
                                                    href={r.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-primary hover:underline">
                                                    {r.title}
                                                </a>
                                                <p className="text-sm text-on-surface-variant">{r.description}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
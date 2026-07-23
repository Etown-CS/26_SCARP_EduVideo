"use client"
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/app/components/loading";
import AgentChat from "../components/agentchat";
import { collection, getDocs, query, orderBy, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/app/firebase/config";
import { match } from "assert";

interface videoEvaluation {
    score: number | null;
    notes: string;
    submittedAt?: Timestamp;
}

interface videoDoc {
    id: string;
    title?: string;
    topic?: string;
    prompt?: string;
    description?: string;
    createdAt?: Timestamp;
    videoUrl?: string;
    tags?: string[];
    status?: string;
    document?: string;
    documentId?: string;
    length?: string;
    evaluation?: videoEvaluation;
}

export default function Gallery() {

    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    const [viewing, setViewing] = useState<videoDoc | null>(null);
    const [videoLoading, setVideoLoading] = useState(true);
    const [videos, setVideos] = useState<videoDoc[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTopic, setSelectedTopic] = useState<string>('all');
    //const [downloading, setDownloading] = useState(false);

    const formatDate = (timestamp?: Timestamp) => {
        if (!timestamp) return '';
        return timestamp.toDate().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        const previous = videos;
        setVideos(prev => prev.filter(v => v.id !== id));
        if (viewing?.id === id) setViewing(null);

        try {
            await deleteDoc(doc(db, 'users', user.uid, 'videos', id));
            if (localStorage.getItem('videoDocId') === id) {
                localStorage.removeItem('videoDocId');
            }
        } catch (err) {
            console.error('Failed to remove video: ', err);
            setVideos(previous);
        }
    }

    {/*
    const handleDownload = async () => {
        if(!videoUrl) return;
        setDownloading(true);
        try{
            const res = await fetch(videoUrl);
            if(!res.ok) throw new Error("Failed to fetch video");
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = `${title || "video"}.mp4`;
            a.click();
            a.remove();
            URL.revokeObjectURL(blobUrl);
        }catch (err){
            console.error("Failed to download video: ", err);
        }finally{
            setDownloading(false);
        }
    };
    */}

    useEffect(() => {
        if (!user) return;
        const getVideos = async () => {
            try {
                const q = query(
                    collection(db, 'users', user.uid, 'videos'),
                    orderBy('createdAt', 'desc')
                );
                const snap = await getDocs(q);
                setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() } as videoDoc)));
            } catch (err) {
                console.error('Failed to fetch videos: ', err);
            } finally {
                setVideoLoading(false);
            }
        };
        getVideos();
    }, [user]);

    const topics = Array.from(
        new Set(videos.map(v => v.topic).filter((t): t is string => !!t))
    ).sort();

    const filteredVideos = videos.filter(video => {
        const matchesTopic = selectedTopic === 'all' || video.topic === selectedTopic;
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch = query === '' || video.title?.toLowerCase().includes(query) || video.tags?.some(tag => tag.toLowerCase().includes(query));
        return matchesTopic && matchesSearch;
    });

    useEffect(() => {
        if (!user && !loading) {
            router.push('/sign-in');
        }
    }, [user, router, loading]);

    if (loading) return (
        <Loading />
    );

    if (!user) return null;

    return (
        <main className="flex-grow">
            <section className="relative pt-5 pb-32 px-6 overflow-hidden">
                <div className="px-4 md:px-8 py-6">
                    <h1 className="font-headline text-3xl font-bold text-on-background">Video Gallery</h1>
                    <p className="mt-3 max-w-3xl text-md text-on-surface-variant font-body leading-relaxed">Here is where you can view your generated videos.</p>
                    <div className="flex flex-row items-start gap-8 mt-8">
                        <div className="flex flex-col flex-1 min-w-0">
                            {!videoLoading && videos.length > 0 && (
                                <div className="flex flex-col sm:flex-row gap-4 mb-6 w-full">
                                    <div className="relative flex-1">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                                            search
                                        </span>
                                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by title or tag..." className="w-full font-label pl-10 pr-4 py-2 rounded-lg bg-surface-container-lowest shadow-neomorph-raised text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none" />
                                    </div>
                                    <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} className="px-4 py-2 font-label rounded-lg bg-surface-container-lowest shadow-neomorph-raised text-sm text-on-surface focus:outline-none cursor-pointer">
                                        <option value="all">All Topics</option>
                                        {topics.map(topic => (
                                            <option key={topic} value={topic}>{topic}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {videoLoading ? (
                                <p className="text-on-surface-variant">Loading your videos...</p>
                            ) : videos.length === 0 ? (
                                <p className="text-on-surface-variant">No videos generated yet. Go to the generate page to upload documents and get started.</p>
                            ) : filteredVideos.length === 0 ? (
                                <p className="text-on-surface-variant">No videos match your search or filter</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {filteredVideos.map((video) => (
                                        <div key={video.id} onClick={() => setViewing(video)} className="bg-surface-container-lowest rounded-xl p-6 shadow-neomorph-raised group cursor-pointer transition-transform duration-300 hover:-translate-y-1">
                                            <div className="relative aspect-video bg-inverse-surface rounded-2xl overflow-hidden shadow-inner mb-4">
                                                {video.videoUrl && video.status === 'complete' && (
                                                    <video src={video.videoUrl} className="w-full h-full object-cover" muted />
                                                )}
                                                <div className="absolute inset-0 flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                                    <div className="w-16 h-16 rounded-full bg-surface/90 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                                                        <span className="material-symbols-outlined text-4xl">play_arrow</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h3 className="font-headline text-lg font-semibold text-on-surface">{video.title || 'Untitled'}</h3>
                                                    {video.topic && (
                                                        <span className="shrink-0 bg-secondary text-on-primary px-3 py-1 rounded-full font-label text-xs">{video.topic}</span>
                                                    )}
                                                </div>
                                                {video.description && (
                                                    <p className="font-body text-sm text-secondary ">{video.description}</p>
                                                )}
                                                {video.tags && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {video.tags.map((tag, index) => (
                                                            <span key={index} className="shrink-0 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label text-xs">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <AgentChat />
                    </div>
                </div>
            </section>
            {viewing && (
                <div onClick={() => setViewing(null)} className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-on-background/40 backdrop-blur-sm">
                    <div onClick={(e) => e.stopPropagation()} className="bg-surface rounded-2xl overflow-hidden w-full max-w-5xl max-h-[90vh] shadow-neomorph-raised flex flex-col">
                        <div className="flex items-center justify-between px-4 py-7 border-b border-outline-variant/30">
                            <div className="flex items-center gap-3">
                                <h2 className="font-display text-xl font-bold text-on-surface">{viewing.title || 'Unknown'}</h2>
                                {viewing.topic && (
                                    <span className="shrink-0 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label text-xs">{viewing.topic}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => handleDelete(viewing.id)} className="text-secondary hover:text-error transition-colors cursor-pointer">
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                                <button onClick={() => setViewing(null)} className="text-secondary hover:text-primary transition-colors cursor-pointer">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>
                        <div className="shadow-neomorph-raised bg-surface rounded-3xl p-12 overflow-y-auto">
                            <div className="relative aspect-video bg-inverse-surface rounded-2xl overflow-hidden shadow-inner mb-4">
                                {viewing.videoUrl && (
                                    <video src={viewing.videoUrl} controls className="w-full h-full rounded-xl mt-4 object-contain" />
                                )}
                            </div>
                            <div className="flex flex-col gap-4">
                                {viewing.createdAt && (
                                    <p className="font-body text-sm text-secondary"><span className="font-bold">Generated: </span>{formatDate(viewing.createdAt)}</p>
                                )}
                                {viewing.length && (
                                    <p className="font-body text-sm text-secondary"><span className="font-bold">Duration: </span>{viewing.length}</p>
                                )}
                                {viewing.evaluation?.score != null && (
                                    <p className="font-body text-sm text-secondary"><span className="font-bold">Evaluation Score: </span>{viewing.evaluation.score} / 10</p>
                                )}
                                {viewing.topic && (
                                    <p className="font-body text-sm text-secondary"><span className="font-bold">Topic: </span>{viewing.topic}</p>
                                )}
                                {viewing.description && (
                                    <p className="font-body text-sm text-secondary"><span className="font-bold">Description: </span>{viewing.description}</p>
                                )}
                                {viewing.prompt && (
                                    <p className="font-body text-sm text-secondary"><span className="font-bold">Prompt: </span>{viewing.prompt}</p>
                                )}
                                {viewing.tags && (
                                    <div className="flex flex-wrap gap-2 font-body text-sm text-secondary"> <span className="font-bold">Tags: </span>
                                        {viewing.tags.map((tag, index) => (
                                            <span key={index} className="shrink-0 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label text-xs">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {viewing.document && (
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="font-body text-sm text-secondary"><span className="font-bold">Document: </span>{viewing.document} </p>
                                        {viewing.documentId && (
                                            <button onClick={() => router.push(`/documents?docId=${encodeURIComponent(viewing.documentId!)}`)}
                                                className="bg-secondary-container text-on-secondary-container py-3 px-5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer mb-4">
                                                <span className="material-symbols-outlined text-sm">document_search</span>View Document
                                            </button>
                                        )}
                                    </div>
                                )}
                                {/*
                                <div className="flex justify-center">
                                    <button
                                        className="w-50 bg-primary text-on-primary py-3 px-5 rounded-lg font-bold text-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer mb-4">
                                        <span className="material-symbols-outlined text-md">download</span>Download Video
                                    </button>
                                </div>
                                */}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
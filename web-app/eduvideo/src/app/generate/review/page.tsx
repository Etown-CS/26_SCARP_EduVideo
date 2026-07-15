"use client"
import Aside from "@/app/components/aside";
import { auth } from "@/app/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import AgentChat from "@/app/components/agentchat";
import Loading from "@/app/components/loading";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/app/firebase/config";
import { serverTimestamp, collection, addDoc, getDoc, doc} from "firebase/firestore";
import { cleanupAbandoned, clearPipelineState } from "@/app/lib/pipelineState";

{/*
function getVideoDuration(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => resolve(video.duration);
        video.onerror = () => reject(new Error('Failed to load video metadata'));
        video.src = url;
    });
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds/60);
    const secs = Math.round(seconds%60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
*/}

export default function Review() {

    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [preloaded, setPreloaded] = useState<string | null>(null);
    const [prompt, setPrompt] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('prompt') || '';
        }
        return '';
    })

    const handleApprove = () => {
        setPrompt('');
        setFiles([]);
        setPreloaded(null);
        router.push("/generate/final-video")
    }

    useEffect(() => {
        const url = localStorage.getItem('completedVideoUrl');
        if (url) setVideoUrl(url);
    }, []);

    useEffect(() => {
        if(!user || !videoUrl) return;
        
        const createDraft = async () => {
            try{
                const existingId = localStorage.getItem('videoDocId');

                if(existingId){
                    const existingSnap = await getDoc(doc(db, 'users', user.uid, 'videos', existingId));
                    if(existingSnap.exists()) return;
                    localStorage.removeItem('videoDocId');
                }

                const fileId = localStorage.getItem('activeFileId');
                const fileName = localStorage.getItem('selectedDocument');
                
                {/*
                let length = 'Unknown';
                try{
                    const seconds = await getVideoDuration(videoUrl);
                    length = formatDuration(seconds);
                }catch(err){
                    console.error('Failed to get video duration: ', err);
                }
                */}
                
                const docRef = await addDoc(collection(db, 'users', user.uid, 'videos'), {
                    videoUrl,
                    status: 'draft',
                    title: '',
                    topic: '',
                    description: '',
                    tags: [],
                    document: fileName || '',
                    documentId: fileId || null,
                    length: 'Unknown',
                    createdAt: serverTimestamp(),
                });
                localStorage.setItem('videoDocId', docRef.id);
            } catch (err) {
                console.error('Failed to create draft: ', err);
            }
        };
        createDraft();
    }, [user, videoUrl]);

    const handleAbandon = async () => {
        const confirmed = window.confirm(
            "Starting over will erase your video's current progress. Do you want to continue?"
        );
        if(confirmed){
            await cleanupAbandoned(user);
            clearPipelineState();
            router.push("/generate");
        }
    };

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
                            <div>
                                <h1 className="font-headline text-3xl font-bold text-on-background">Review</h1>
                                <p className="max-w-2xl mt-4">Watch your video here. If you are unhappy with the results, you can go back and edit your prompt. If you like what you see, approve your video for exporting.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={handleAbandon}
                                    className="shadow-neomorph-raised bg-surface-container-low px-4 py-2 rounded-lg flex items-center gap-2 text-on-surface-variant font-md hover:translate-y-[-1px] transition-all cursor-pointer">
                                    <span className="material-symbols-outlined">delete_forever</span>
                                    Start Over
                                </button>
                                <button
                                    onClick={() => router.push("/generate/edit")}
                                    className="shadow-neomorph-raised bg-surface-container-low px-4 py-2 rounded-lg flex items-center gap-2 text-on-surface-variant font-medium hover:translate-y-[-1px] transition-all cursor-pointer">
                                    <span className="material-symbols-outlined">undo</span>
                                    Return to Edit
                                </button>
                                <button
                                    onClick={handleApprove}
                                    className="shadow-neomorph-raised bg-primary text-on-primary px-6 py-2 rounded-lg flex items-center gap-2 font-medium hover:translate-y-[-1px] transition-all cursor-pointer">
                                    <span className="material-symbols-outlined">publish</span>
                                    Approve
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                            <div className="col-span-8 flex flex-col gap-4 min-h-0">
                                <div className="shadow-neomorph-raised bg-surface rounded-3xl p-12 overflow-hidden">
                                    <div className="aspect-video bg-inverse-surface rounded-2xl overflow-hidden shadow-inner">
                                        {videoUrl && (
                                            <video src={videoUrl} controls className="w-full h-full rounded-xl mt-4 object-contain" />
                                        )}
                                    </div>
                                </div>
                                <div className="h-48 bg-surface-container-low rounded-2xl p-4 shadow-neomorph-sunken overflow-hidden flex flex-col">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-headline font-bold text-on-surface-variant flex items-center gap-2">
                                            Video Review
                                        </span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 text-on-surface-variant space-y-3">
                                        <div className="flex justify-between items-center text-md">
                                            <span className="text-outline">Eval Method 1</span>
                                            <span className="font-bold">Score 1</span>
                                        </div>
                                        <div className="flex justify-between items-center text-md">
                                            <span className="text-outline">Eval Method 2</span>
                                            <span className="font-bold">Score 2</span>
                                        </div>
                                        <div className="flex justify-between items-center text-md">
                                            <span className="text-outline">Eval Method 3</span>
                                            <span className="font-bold">Score 3</span>
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
        </main >
    )
}
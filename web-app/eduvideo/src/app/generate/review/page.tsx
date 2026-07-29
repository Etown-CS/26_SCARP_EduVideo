"use client"
import Aside from "@/app/components/aside";
import { auth } from "@/app/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import AgentChat from "@/app/components/agentchat";
import Loading from "@/app/components/loading";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/app/firebase/config";
import { serverTimestamp, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { cleanupAbandoned, clearPipelineState } from "@/app/lib/pipelineState";

export default function Review() {

    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [preloaded, setPreloaded] = useState<string | null>(null);
    const [score, setScore] = useState<number | null>(null);
    const [notes, setNotes] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
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

    const handleSubmission = async () => {
        if(score === null || !user) return;
        const videoDocId = localStorage.getItem('videoDocId');
        if(!videoDocId){
            console.error('No videoDocId found.');
            return;
        }
        setSubmitting(true);
        try{
            await updateDoc(doc(db, 'users', user.uid, 'videos', videoDocId), {
                evaluation: {
                    score,
                    notes,
                    submittedAt: serverTimestamp(),
                },
            });
            setSubmitted(true);
            setScore(null);
            setNotes('');
        }catch(err){
            console.error("Failed to submit review: ", err);
        }finally{
            setSubmitting(false);
        }
    };

    useEffect(() => {
        const videoDocId = localStorage.getItem('videoDocId');
        if(!videoDocId || !user) return;

        const unsub = onSnapshot(doc(db, 'users', user.uid, 'videos', videoDocId), (snap) => {
            const data = snap.data();
            if(data?.videoUrl) setVideoUrl(data.videoUrl);
        });
        return () => unsub();
    }, [user]);

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
                                <div className="bg-surface-container-low rounded-2xl p-4 shadow-neomorph-sunken overflow-hidden flex flex-col">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-headline font-bold text-on-surface-variant flex items-center gap-2">
                                            Optional Video Review
                                        </span>
                                    </div>
                                    <p className="text-sm text-on-surface-variant mb-4">
                                        If you are interested in helping us make the video generation better, please give a brief evaluation of the quality of your video. Rank the video overall on a scale from 1 to 10 with 1 being the worst and 10 being the best. Then if you have any specific notes please add them to the box below. For example, how accurate the content was, how good the visuals were, or how well synced the audio and visual were.
                                    </p>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 text-on-surface-variant space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-on-surface-variant"><span className="font-bold">Rating</span></span>
                                            {score !== null && (
                                                <span className="font-label text-primary font-bold">{score} / 10</span>
                                            )}
                                        </div>
                                        <div className="flex gap-2 flex-wrap mb-4 justify-center">
                                            {Array.from({length: 10}, (_, i) => i + 1).map((num) => (
                                                <button key={num} onClick={() => setScore(num)} className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium border transition-all cursor-pointer ${
                                                    score === num
                                                    ? 'bg-primary text-on-primary border-primary/20'
                                                    : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:translate-y-[-1px]'
                                                }`} >
                                                    {num}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="reviewNotes" className="text-sm font-medium text-on-surface-variant block mb-2">
                                            <span className="font-bold">
                                                Additional Notes
                                            </span>
                                        </label>
                                        <textarea id="reviewNotes" name="reviewNotes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional input. What worked well or what didn't work at all..." 
                                        className="w-full shadow-neomorph-sunken bg-surface p-3 rounded-xl text-sm outline-none resize-none h-20 focus:ring-1 ring-primary"/>
                                    </div>
                                    <div className="flex justify-end">
                                        <button onClick={handleSubmission} className="px-5 py-2 bg-primary text-on-primary rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer">
                                            Submit Review
                                        </button>
                                    </div>
                                    {submitted && (
                                        <p className="text-sm text-primary font-medium">Thank you for submitting your feedback!</p>
                                    )}
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
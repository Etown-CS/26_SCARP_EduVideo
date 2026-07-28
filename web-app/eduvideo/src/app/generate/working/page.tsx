"use client"

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import Loading from "@/app/components/loading";
import Aside from "@/app/components/aside";
import AgentChat from "@/app/components/agentchat";
import { cleanupAbandoned, clearPipelineState } from "@/app/lib/pipelineState";
import Image from "next/image";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/app/firebase/config";

const CONFETTI_COLORS = ["#8b5cf6", "#db2777", "#f472b6", "#3b82f6", "#a855f7", "#fbbf24", "#10b981"];
const STAGE_PROGRESS: Record<string, number> = {
    doc_analysis: 20,
    pedagogical_structuring: 45,
    script_gen: 70,
    visual_gen: 90,
    done: 100,
};

function fireConfetti(originX: number, originY: number, count = 60) {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "0";
    container.style.top = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.pointerEvents = "none";
    container.style.zIndex = "9999";
    document.body.appendChild(container);
    const speedFactor = 3.1;
    const fallSpeedFactor = 1.5

    for (let i = 0; i < count; i++) {
        const piece = document.createElement("div");
        const angle = Math.random() * Math.PI * 2;
        const burstDistance = 120 + Math.random() * 100;
        const fallDistance = 350 + Math.random() * 220;
        const dxBurst = Math.cos(angle) * burstDistance;
        const dyBurst = Math.sin(angle) * burstDistance - 40;
        const rotation = Math.random() * 720 - 360;
        const size = 6 + Math.random() * 6;
        const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        const growDuration = (80 + Math.random() * 40) * speedFactor;
        const burstDuration = (180 + Math.random() * 80) * speedFactor;
        const fallDuration = (700 + Math.random() * 400) * fallSpeedFactor;
        const fallStartDelay = growDuration + burstDuration * 0.55;
        piece.style.position = "absolute";
        piece.style.left = `${originX}px`;
        piece.style.top = `${originY}px`;
        piece.style.width = `${size}px`;
        piece.style.height = `${size * 0.5}px`;
        piece.style.backgroundColor = color;
        piece.style.borderRadius = "1px";
        piece.style.opacity = "0";
        piece.style.transform = "translate(-50%, -50%) scale(0) rotate(0deg)";
        piece.style.transformOrigin = "center";
        container.appendChild(piece);
        requestAnimationFrame(() => {
            piece.style.transition = `transform ${growDuration}ms ease-out, opacity ${growDuration}ms ease-out`;
            piece.style.transform = `translate(-50%, -50%) scale(1) rotate(${rotation * 0.2}deg)`;
            piece.style.opacity = "1";
        });
        setTimeout(() => {
            piece.style.transition = `transform ${burstDuration}ms cubic-bezier(0.15, 0.7, 0.4, 1)`;
            piece.style.transform = `translate(calc(-50% + ${dxBurst}px), calc(-50% + ${dyBurst}px)) scale(1) rotate(${rotation}deg)`;
        }, growDuration);
        setTimeout(() => {
            piece.style.transition = `transform ${fallDuration}ms cubic-bezier(0.55, 0.06, 0.68, 0.19), opacity ${fallDuration}ms ease-in`;
            piece.style.transform = `translate(calc(-50% + ${dxBurst * 1.4}px), calc(-50% + ${dyBurst + fallDistance}px)) rotate(${rotation * 1.5}deg)`;
            piece.style.opacity = "0";
        }, fallStartDelay);
        setTimeout(() => piece.remove(), fallStartDelay + fallDuration);
    }
    setTimeout(() => container.remove(), 1800 * speedFactor);
}

export default function WorkingPage() {
    const router = useRouter();
    const [user, loading] = useAuthState(auth);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('Starting...');
    const [timeRemaining, setTimeRemaining] = useState<string>('Calculating...');
    //const startTimeRef = useRef<number>(Date.now());
    const loadingCircleRef = useRef<HTMLDivElement>(null);
    const [stage, setStage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

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

    {/*
    useEffect(() => {
        const jobId = localStorage.getItem('currentJobId');

        if (!jobId) {
            router.push('/generate');
            return;
        }

        const poll = setInterval(async () => {
            const data = await fetch(`/api/generate?jobId=${jobId}`).then(r => r.json());
            setProgress(data.progress);
            setStatus(data.status);

            if (data.progress > 0) {
                const elapsed = (Date.now() - startTimeRef.current) / 1000;
                const rate = data.progress / elapsed;
                const remaining = (100 - data.progress) / rate;

                if (remaining < 60) {
                    setTimeRemaining(`${Math.round(remaining)} seconds`);
                } else {
                    setTimeRemaining(`${Math.round(remaining / 60)} minutes`);
                }
            }

            if (data.status === 'complete') {
                clearInterval(poll);
                setTimeRemaining('Done!');
                localStorage.setItem('completedVideoUrl', data.videoUrl);
                localStorage.removeItem('currentJobId');
                const rect = loadingCircleRef.current?.getBoundingClientRect();
                if (rect) {
                    fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
                }
                setTimeout(() => {
                    router.push('/generate/review');
                }, 1200);
            }
        }, 2000);
        return () => clearInterval(poll);
    }, []);
    */}

    useEffect(() => {
        if (!user && !loading) router.push('/sign-in');
    }, [user, router, loading]);

    useEffect(() => {
        const videoDocId = localStorage.getItem('videoDocId');
        if (!videoDocId || !user) return;

        const unsub = onSnapshot(doc(db, 'users', user.uid, 'videos', videoDocId), (snap) => {
            const data = snap.data();
            if (!data) return;
            setStage(data.stage);
            setStatus(data.status);
            setProgress(STAGE_PROGRESS[data.stage] ?? 0);

            if (data.status === 'complete') {
                router.push('/generate/review');
            } else if (data.status === 'failed') {
                setError(data.error);
            }
        });
        return () => unsub();
    }, [user]);

    if (loading) return (
        <Loading />
    )

    return (
        <main className="flex-grow flex items-center justify-center">
            <section className="relative pt-5 pb-32 px-6 overflow-hidden">
                <div className="flex gap-8 relative z-10 items-start">
                    <Aside />
                    <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden bg-surface rounded-2xl">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="font-headline text-3xl font-bold text-on-background">Generating...</h1>
                            </div>
                        </div>
                        <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                            <div className="col-span-8 flex flex-col gap-4 min-h-0">
                                <div className="shadow-neomorph-raised bg-surface-container rounded-2xl p-5 border border-outline-variant/30">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-headline font-bold text-on-surface">Generation Status</h3>
                                        <span className="font-label text-primary font-bold">{progress}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden mb-3">
                                        <div className="h-full bg-primary-container animate-pulse" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <p className="text-xs text-on-surface-variant leading-relaxed">
                                        Creating your video now. Please be patient as it may take a few minutes. Estimated completion: <span className="font-bold">{timeRemaining}</span>.
                                    </p>
                                </div>
                                <div className="flex justify-center">
                                    <div ref={loadingCircleRef} className="w-28 h-28">
                                        <Image src='/blue-pop-up-removebg-preview.png' alt="Blue Pop Up" width={100} height={100} className={`w-28 h-28 ${status !== 'complete' ? 'animate-spin' : ''} border-6 border-primary border-t-transparent rounded-full`} loading="eager"></Image>
                                    </div>
                                </div>
                                <div>
                                    <button onClick={handleAbandon} className="shadow-neomorph-raised bg-surface-container-low px-4 py-2 rounded-lg flex items-center gap-2 text-on-surface-variant font-md hover:translate-y-[-1px] transition-all cursor-pointer">
                                        <span className="material-symbols-outlined">delete_forever</span>
                                        Start Over
                                    </button>
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
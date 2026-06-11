"use client"

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import Loading from "@/app/components/loading";
import Aside from "@/app/components/aside";
import AgentChat from "@/app/components/agentchat";

export default function WorkingPage() {
    const router = useRouter();
    const [user, loading] = useAuthState(auth);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('Starting...');
    const [timeRemaining, setTimeRemaining] = useState<string>('Calculating...');
    const startTimeRef = useRef<number>(Date.now());

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

            if(data.progress > 0){
                const elapsed = (Date.now() - startTimeRef.current) / 1000;
                const rate = data.progress /elapsed;
                const remaining = (100 - data.progress) / rate;

                if(remaining < 60){
                    setTimeRemaining(`${Math.round(remaining)} seconds`);
                }else{
                    setTimeRemaining(`${Math.round(remaining / 60)} minutes`);
                }
            }

            if (data.status === 'complete') {
                clearInterval(poll);
                setTimeRemaining('Done!');
                localStorage.setItem('completedVideoUrl', data.videoUrl);
                localStorage.removeItem('currentJobId');
                router.push('/generate/review');
            }
        }, 2000);
        return () => clearInterval(poll);
    }, []);

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
                                <div className="shadow-neomorphic-raised bg-surface-container rounded-2xl p-5 border border-outline-variant/30">
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
"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import Loading from "@/app/components/loading";

export default function WorkingPage() {
    const router = useRouter();
    const [user, loading] = useAuthState(auth);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('Starting...');

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

            if (data.status === 'complete') {
                clearInterval(poll);
                localStorage.setItem('completedVideoUrl', data.videoUrl);
                localStorage.removeItem('currentJobId');
                router.push('/generate/review');
            }
        }, 2000);
        return () => clearInterval(poll);
    }, []);

    if(loading) return (
        <Loading />
    )
    
    return (
        <main className="flex-grow flex items-center justify-center">
            <div className="shadow-neomorphic-raised bg-surface-container rounded-2xl p-5 border border-white/50">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-headline font-bold text-on-surface">Generation Status</h3>
                    <span className="font-label text-primary font-bold">{progress}%</span>
                </div>
                <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-primary-container animate-pulse" style={{width: `${progress}%`}}></div>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                    Finalizing render of transition effects and high-fidelity textures. Estimated completion: <span className="font-bold">?</span>.
                </p> 
            </div>
        </main>
    )

}
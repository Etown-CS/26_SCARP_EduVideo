"use client"

import Aside from "@/app/components/aside";
import { auth } from "@/app/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import AgentChat from "@/app/components/agentchat";
import Loading from "@/app/components/loading";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Review() {

    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [preloaded, setPreloaded] = useState<string | null>(null);
    const [prompt, setPrompt] = useState(() => {
        if(typeof window !== 'undefined'){
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
                            </div>
                            <div className="flex gap-3">
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
                                {/*
                                <div className="relative h-[500px] bg-on-surface rounded-2xl overflow-hidden shadow-2xl group">
                                    <img alt="Physics visualization rendering" className="w-full h-full object-cover opacity-90" data-description="Video preview showing 3D molecular structures rotating in a physics simulation." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAc62_YABcIlzfG7Nggbtdb1bwiVG0DPIKuquq-FW21riChhIoQjWvNewPfAeLftp9jk-v025HR16gm62vVI4-KC1OT3jvpjZYRnM19hMeqYF9oI_EAqFHINVZ_O4YCa0eG50izl8pNYSdyiM3fC9mkJyi7_v7zpRqLT3nzXEPJI8FXrU5O8uOXrDG6hPApul-HwRYKtIEfVOzBpRoU51WW_ULc7ECHr-yxZEuUadK5yDvPPRNvWd_1ZagEluIsvRhW18OmEyurBg8">
                                    </img>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                                        <div className="flex items-center gap-4 text-white">
                                            <span className="material-symbols-outlined cursor-pointer text-3xl">play_arrow</span>
                                            <div className="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary w-[75%] relative">
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"></div>
                                                </div>
                                            </div>
                                            <span className="font-label text-sm">08:24 / 11:00</span>
                                            <span className="material-symbols-outlined cursor-pointer">volume_up</span>
                                            <span className="material-symbols-outlined cursor-pointer">fullscreen</span>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <button className="w-20 h-20 bg-primary/90 text-white rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm transition-transform active:scale-90 cursor-pointer">
                                            <span className="material-symbols-outlined text-4xl">play_arrow</span>
                                        </button>
                                    </div>
                                </div>
                                */}
                                {videoUrl && (
                                    <video src={videoUrl} controls className="w-full h-115 rounded-xl mt-4" />
                                )}
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
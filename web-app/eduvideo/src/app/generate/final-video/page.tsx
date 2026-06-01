"use client"

import Aside from "@/app/components/aside";
import { auth } from "@/app/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import Image from "next/image";

export default function FinalVideo() {

    const [user, loading] = useAuthState(auth);

    if (loading) return (
        <div className="min-h-screen bg-surface flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <main className="flex-grow">
            <section className="relative pt-5 pb-32 px-6 overflow-hidden">
                <div className="flex gap-8 relative z-10 items-start">
                    <Aside />
                    <div className="flex-1 flex text-center items-center flex-col pt-5">
                        <h1 className="font-headline text-3xl font-bold text-on-background self-start mb-6">Final Render</h1>
                        <div className="neomorph-raised bg-surface rounded-3xl p-4 overflow-hidden relative group">
                            <div className="aspect-video bg-inverse-surface rounded-2xl overflow-hidden relative shadow-inner w-xl">
                                <Image className = "w-full h-full object-cover opacity-80" src="/vercel.svg" alt="Vercel stand in image" width={700} height={700} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <button className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-white hover:scale-110 transition-transform active:scale-95 shadow-xl">
                                        <span className="material-symbols-outlined text-4xl text-primary">play_arrow</span>
                                    </button>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-full shadow-[0_0_10px_rgba(0,87,255,1)]"></div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-4 px-2">
                                <div className="flex items-center gap-4 text-on-surface-variant">
                                    <span className="font-label text-sm">timestamp</span>
                                    <span className="font-label text-sm">volume</span>
                                </div>
                                <button className="flex items-center gap-2 text-primary hover:bg-primary/5 px-4 py-2 rounded-lg transition-all font-headline font-bold">
                                    <span className="material-symbols-outlined">fullscreen</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-12 lg:col-span4 flex flex-col gap-6">
                        <div className="neomorph-raised bg-surface rounded-3xl p-6 h-fit sticky top-24">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-headline text-xl font-bold text-on-surface">Set video information</h2>
                                <button className="p-2 hover:bg-surface-container rounded-lg text-primary transition-all">
                                    <span>edit</span>
                                </button>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">Title</label>
                                    <div className="neomorph-inset bg-surface-container-low p-3 rounded-xl">
                                        <p className="font-headline font-bold text-on-surface">put your title here</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">Description</label>
                                    <div className="neomorph-inset bg-surface-container-low p-4 rounded-xl">
                                        <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                                            Here is where your description would go
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">Tags</label>
                                    <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-label">tag#1</span>
                                    <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-label">tag#2</span>
                                    <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-label">tag#3</span>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-outline-variant/30 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-on-surface-variant">Aspect Ratio</span>
                                    <span className="text-xs font-bold">16:9</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-on-surface-variant">Frame Rate</span>
                                    <span className="text-xs font-bold">60 fps</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-on-surface-variant">Bitrate</span>
                                    <span className="text-xs font-bold">32 Mbps</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
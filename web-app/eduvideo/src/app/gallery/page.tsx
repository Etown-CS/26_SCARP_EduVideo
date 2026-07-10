"use client"
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/app/components/loading";
import AgentChat from "../components/agentchat";

export default function Gallery() {

    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    const [fileNames, setFileNames] = useState<{ id: string, name: string, prompt: string, date?: string }[]>([]);
    const [viewing, setViewing] = useState<typeof fileNames[0] | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [previewLoad, setPreviewLoad] = useState(false);

    useEffect(() => {
        if (!user && !loading) {
            router.push('/sign-in');
        }
    }, [user, router, loading]);

    {/*
    useEffect(() => {
        if(!viewing){
            setPreview(null);
            return;
        }

        setPreviewLoad(true);
    }, [viewing]); */}

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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-neomorph-raised group cursor-pointer transition-transform duration-300 hover:-translate-y-1">
                                <div className="relative aspect-video rounded-lg overflow-hidden mb-4 shadow-inner">
                                    <img alt="Data Structures &amp; Algorithms" className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida/ADBb0ugJZiPcxHno2txZ_AFMzGgywzcfj22Wrmtfvxi03cnDKaLxtluwtbQjFv0iDAxkgyCJXu5esmRObXZPm8g56oY-dakZuLA5qjSw4uZO_Ifj8DJcqIAq9NsBNv03yXn6gU7sCzAGLEO6HRRv932W_-4dKWvMDlIEogj3Um8P-9KT2LlJVeus8F5fOpsHNfdLuPifYjv54qGkYraCxhLmMDsYdjr5aOsTGrHUg72WQd3HTDL-kn02lnW3ViQ" />
                                    <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-surface/90 backdrop-blur-sm flex items-center justify-center text-primary shadow-neomorph-raised group-hover:scale-110 transition-transform duration-300">
                                            <span className="material-symbols-outlined text-4xl">play_arrow</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="font-headline text-lg font-semibold text-on-surface">Data Structures &amp; Algorithms</h3>
                                        <span className="shrink-0 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label text-xs">Computer Science</span>
                                    </div>
                                    <p className="font-body text-sm text-secondary">Lecture 1: Binary Search Trees &amp; Linked Lists</p>
                                </div>
                            </div>
                            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-neomorph-raised group cursor-pointer transition-transform duration-300 hover:-translate-y-1">
                                <div className="relative aspect-video rounded-lg overflow-hidden mb-4 shadow-inner">
                                    <img alt="Cloud System Architecture" className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwqBjxYAeMFaBUqFtfcrGRCoA-B3LsLXpha0TnirjG_1krDeC8zMbTNit23CpC4sCo6FbWo5UlrUZBCKv53IzzZ9vujqiJOf20PHA0RhBsDg_wKbnmHGCeZQMTKzk4Vdse1MCBtp2XHvrhTEOq8KqsqnbXHGgo0lQK8eG2YD20Ym7vffVXyidnnoBoMKUx45WW0vKBc3mPVv-EPJDupznBa3CryONMgQWwVD7G7IIj-buNrGjRSN-MqqhkJk4BBbkCHf6AtrdUnEo" />
                                    <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-surface/90 backdrop-blur-sm flex items-center justify-center text-primary shadow-neomorph-raised group-hover:scale-110 transition-transform duration-300">
                                            <span className="material-symbols-outlined text-4xl">play_arrow</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="font-headline text-lg font-semibold text-on-surface">Cloud System Architecture</h3>
                                        <span className="shrink-0 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label text-xs">Architecture</span>
                                    </div>
                                    <p className="font-body text-sm text-secondary">Tutorial: Scaling Distributed Systems</p>
                                </div>
                            </div>
                            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-neomorph-raised group cursor-pointer transition-transform duration-300 hover:-translate-y-1">
                                <div className="relative aspect-video rounded-lg overflow-hidden mb-4 shadow-inner">
                                    <img alt="Neural Networks &amp; ML" className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWSsKY8wiScO3a6DukGHNwegliOZDO1d0Ecj-EqRX2d4Ykfe0TN-xlgS0OqRy3xkB_J-U9sfkutJdsTaOvVTOe4wuR-dOg22YXye-RI__IK9Jp2pscWN_MflzFahSAt0L2mnBZtP40n_1aYxhhCU2T82CVeNdtP4YnKLX1LRtBBNhxh5MzHSZvTC7jQQ8M_tGW7h-1HsEDYrdKWSpNPmHnRRjqnC3JqPlfHGTCZi6JCDWA6laCy1NWrltj9vF6K_FkJPeuaSX_zro"></img>
                                    <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-surface/90 backdrop-blur-sm flex items-center justify-center text-primary shadow-neomorph-raised group-hover:scale-110 transition-transform duration-300">
                                            <span className="material-symbols-outlined text-4xl">play_arrow</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="font-headline text-lg font-semibold text-on-surface">Neural Networks and ML</h3>
                                        <span className="shrink-0 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label text-xs">Machine learning</span>
                                    </div>
                                    <p className="font-body text-sm text-secondary">Deep learning fundamentals</p>
                                </div>
                            </div>
                        </div>
                        <AgentChat />
                    </div>
                </div>
            </section>
            {viewing && (
                <div onClick={() => setViewing(null)} className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-on-background/40 backdrop-blur-sm">
                    <div onClick={(e) => e.stopPropagation()} className="bg-surface rounded-2xl overflow-hidden w-full max-w-3xl shadow-neomorph-raised">
                        <div className="flex items-center justify-between px-md py-sm border-b border-outline-variant/30">
                            <h2 className="font-display text-lg font-bold text-on-surface">Video Title</h2>
                            <div className="flex items-center gap-sm">
                                <button className="text-secondary hover:text-primary transition-colors cursor-pointer">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>
                        <div className="relative aspect-video bg-on-background">
                            <img alt="Video Thumbnail" className="w-full h-full object-cover opacity-80" src="https://lh3.googleusercontent.com/aida/AP1WRLt6g8vTAWDU2Wm3MLoxTuz7MnETSTkF_7-R0zd9HMA6Qox047iGEmzP9bnPzLak7sFA4NGIctFftM8qEuf60GA31rInEQ3A24YOJmQzTTXR-d-W4bMjNy2gyPS6Imc6s4dQBvlKTfEwx7QJXye9kNnUZLsrLm2pLK-mTSr6gTuJO40w49jwVtJuTAytjb0s853FXkN-rpGbBoO6Jb3HuVfDzGhgSaE743uNi9v_6BN-ZhZ6N9Q6VRgbrfQ" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <button className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center beveled-primary hover:scale-110 transition-transform duration-300 cursor-pointer">
                                    <span className="material-symbols-outlined text-4xl">play_arrow</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
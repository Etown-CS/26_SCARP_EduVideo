"use client"

import Aside from "@/app/components/aside";
import { auth } from "@/app/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import AgentChat from "@/app/components/agentchat";

export default function Edit() {

    const [user, loading] = useAuthState(auth);

    if (loading) return (
        <div className="min-h-screen bg-surface flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    )
    return (
        <main className="flex-grow">
            <section className="relative pt-5 pb-32 px-6 overflow-hidden">
                <div className="flex gap-8 relative z-10 items-start">
                    <Aside />
                    <div className="flex-1 flex text-center items-center flex-col pt-20">
                        <p>This is where the user will be able to select keywords and make edits to their prompt. In addition, this page will have a progress bar for the video creation process. The here is just a mock up of what it could look like.</p>
                        <div className="neomorphic-raised bg-surface-container rounded-2xl p-5 border border-white/50">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-headline font-bold text-on-surface">Synthesis Status</h3>
                                <span className="font-label text-primary font-bold">95%</span>
                            </div>
                            <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden mb-3">
                                <div className="h-full bg-primary-container w-[95%] animate-pulse"></div>
                            </div>
                            <p className="text-xs text-on-surface-variant leading-relaxed">
                                Finalizing render of transition effects and high-fidelity textures. Estimated completion: <span className="font-bold">42 seconds</span>.
                            </p>
                        </div>
                    </div>
                    <AgentChat />
                </div>
            </section>
        </main>
    )
}
"use client"

import Aside from "@/app/components/aside";
import { auth } from "@/app/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";

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
                        <div className="w-full max-w-2xl neomorph-sunken bg-surface-container-highest/80 backdrop-blur-md my-8 px-4 py-8 rounded-lg items-center text-center justify-center gap-2">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-3">
                                </div>
                                <span className="font-label text-label-md text-primary font-bold">89%</span>
                            </div>
                            <div className="w-full h-4 bg-surface-container rounded-full neomorph-sunken overflow-hidden p-0.5">
                                <div className="h-full bg-primary rounded-full progress-bar-glow transition-all duration-1000 ease-in-out"></div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex gap-4">
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-4 py-1 text-sm font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors">Pause</button>
                                    <button className="px-4 py-1 text-sm font-bold text-error hover:bg-error/10 rounded-lg transition-colors">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
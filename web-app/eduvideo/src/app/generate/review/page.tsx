"use client"

import Aside from "@/app/components/aside";
import { auth } from "@/app/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";

export default function Review(){

    const [user, loading] = useAuthState(auth);

    if(loading) return(
        <div className = "min-h-screen bg-surface flex items-center justify-center">
            <div className = "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    )
    return(
        <main className="flex-grow">
            <section className="relative pt-5 pb-32 px-6 overflow-hidden">
                <div className="flex gap-8 relative z-10 items-start">
                <Aside/>
                <div className="flex-1 text-center items-center flex-col pt-20">
                    <p>This is where the review process will occur. Our automated evaluation will also occur here</p>
                </div>
                </div>
            </section>
        </main>
    )
}
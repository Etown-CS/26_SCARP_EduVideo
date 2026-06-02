"use client"
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/app/components/loading";

export default function Docs() {

    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    
    const fileNames = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');


    useEffect(() => {
        if (!user && !loading) {
            router.push('/sign-in');
        }
    }, [user, router, loading]);

    if (loading) return (
        <Loading />
    );

    if (!user) return null;
    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <h1 className="font-headline text-3xl font-bold text-on-background px-4 md:px-8 py-6">My Documents</h1>
                    <p className="text-on-surface-variant font-body px-4 md:px-8 py-6">You will be able to see the documents you have uploaded here.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="file-card bg-surface rounded-xl p-6 neomorph-raised border border-white/50 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-6">
                                <span className="font-label text-[12px] text-outline bg-surface-container px-2 py-1 rounded">PDF</span>
                            </div>
                            <h3 className="font-headline text-lg font-semibold text-on-background mb-2">{fileNames}</h3>
                            <p className="text-on-surface-variant text-sm mb-6 flex items-center gap-2">
                                Uploaded Oct 24, 2023
                            </p>
                            <div className="mt-auto pt-6 border-t border-surface-variant flex gap-3">
                            </div>
                        </div>
                        <div className="file-card bg-surface rounded-xl p-6 neomorph-raised border border-white/50 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-6">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                </div>
                                <span className="font-label text-[12px] text-outline bg-surface-container px-2 py-1 rounded">DOCX</span>
                            </div>
                            <h3 className="font-headline text-lg font-semibold text-on-background mb-2">Algorithm_Overview.docx Placeholder</h3>
                            <p className="text-on-surface-variant text-sm mb-6 flex items-center gap-2">
                                Uploaded Oct 22, 2023
                            </p>
                            <div className="mt-auto pt-6 border-t border-surface-variant flex gap-3">
                            </div>
                        </div>
                        <div className="file-card bg-surface rounded-xl p-6 neomorph-raised border border-white/50 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-6">
                                <div className="p-3 bg-gray-50 text-gray-600 rounded-lg">
                                </div>
                                <span className="font-label text-[12px] text-outline bg-surface-container px-2 py-1 rounded">MD</span>
                            </div>
                            <h3 className="font-headline text-lg font-semibold text-on-background mb-2">System_Design.md Placeholder</h3>
                            <p className="text-on-surface-variant text-sm mb-6 flex items-center gap-2">
                                Uploaded Oct 20, 2023
                            </p>
                            <div className="mt-auto pt-6 border-t border-surface-variant flex gap-3">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
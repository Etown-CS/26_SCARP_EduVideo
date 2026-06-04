"use client"
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/app/components/loading";

export default function Docs() {

    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    const [fileNames, setFileNames] = useState<string[]>([]);


    useEffect(() => {
        if (!user && !loading) {
            router.push('/sign-in');
        }
    }, [user, router, loading]);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
        setFileNames(stored);
    }, []);

    const handleDelete = (name: string) => {
        const updated = fileNames.filter(f => f !== name);
        setFileNames(updated);
        localStorage.setItem('uploadedFiles', JSON.stringify(updated));
    }

    if (loading) return (
        <Loading />
    );


    if (!user) return null;
    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div className="px-4 md:px-8 py-6">
                    <h1 className="font-headline text-3xl font-bold text-on-background">My Documents</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                        {fileNames.length > 0 ? (
                            fileNames.map((name) => (
                                <div key={name} className="file-card bg-surface rounded-xl p-6 shadow-neomorph-raised border border-white/50 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-6">
                                        <span className="font-label text-[12px] text-outline bg-surface-container px-2 py-1 rounded">{name.split('.').pop()?.toUpperCase()}</span>
                                    </div>
                                    <h3 className="font-headline text-lg font-semibold text-on-background mb-2">{name}</h3>
                                    <p className="text-on-surface-variant text-sm mb-6 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                        Uploaded {new Date().toLocaleDateString()}
                                    </p>
                                    <div className="mt-auto pt-6 border-t border-surface-variant flex gap-3">
                                        <button className="flex-1 bg-primary-container text-on-primary-container py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer">
                                            <span className="material-symbols-outlined text-[18px]">movie_edit</span>
                                            Generate Video
                                        </button>
                                        <button onClick={() => handleDelete(name)}
                                            className="p-1 bg-error/10 text-on-surface-variant hover:text-error rounded-lg transition-all cursor-pointer">
                                            <span className="text-sm">Delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-on-surface-variant font-body px-4"> No documents </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
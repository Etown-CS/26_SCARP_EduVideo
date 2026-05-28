"use client"
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Docs(){

    const[user, loading] = useAuthState(auth);
    const router = useRouter();

    useEffect(() => {
        if(!user && !loading){
            router.push('/sign-in');
        }
    }, [user, router, loading]);

    if(loading) return (
        <div className = "min-h-screen bg-surface flex items-center justify-center">
            <div className ="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if(!user) return null;

    const fetchDocuments = async () => {
        const q = query(collection(db, 'documents'), where('userId', '==', user?.uid));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        /*Need a way to set the documents*/
    }

    return(
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <h1 className="font-headline text-3xl font-bold text-on-background px-4 md:px-8 py-6">My Documents</h1>
                    <p className="text-on-surface-variant font-body px-4 md:px-8 py-6">You will be able to see the documents you have uploaded here.</p>
                </div>
            </div>
        </div>
    )
}
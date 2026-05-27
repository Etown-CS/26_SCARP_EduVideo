"use client"
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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

    return(
        <div>
            <h1 className = "text-center"> Documents will be stored here! </h1>
        </div>
    )
}
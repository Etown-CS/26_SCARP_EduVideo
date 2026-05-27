"use client"
import {useAuthState} from 'react-firebase-hooks/auth';
import {auth} from "@/app/firebase/config";
import {useRouter} from 'next/navigation';
import { useEffect } from 'react';

export default function Generate(){

    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    
    useEffect(() => {
        if(!loading && !user){
            router.push('/sign-in');
        }
    }, [user, router, loading]);

    if(loading) return (
        <div className = "min-h-screen bg-surface flex items-center justify-center">
            <div className = "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if(!user) return null;

    return(
        <div> 
            <h1 className = "text-center"> Videos will generate here! </h1>
            <div className = "max-w-2xl mx-auto p-4 rounded-xl neomorph-raised bg-surface-container-low group cursor-pointer transition-all duration-300 hover:scale-[1.01]">
            <div className = "border-2 border-dashed border-outline-variant rounded-lg p-12 neomorph-sunken flex flex-col items-center justify-center gap-4 bg-surface-bright">
                <div className = "rounded-full bg-primary-container/10 flex items-center justify-center">
                    <p>
                        This will be the file drop box.
                    </p>
                </div>
            </div>
            </div>
        </div>
    )
}
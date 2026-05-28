"use client"
import {useAuthState} from 'react-firebase-hooks/auth';
import {auth, storage, db} from "@/app/firebase/config";
import {useRouter} from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Aside from '@/app/components/aside';
import {ref, uploadBytes, getDownloadURL} from 'firebase/storage';
import {collection, addDoc, serverTimestamp} from 'firebase/firestore';

export default function Generate(){

    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    const [files, setFiles] = useState<File[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const [prompt, setPrompt] = useState('');
    
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

    const handleBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files){
            const selected = Array.from(e.target.files);
            setFiles(prev => [...prev, ...selected]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_,i) => i !== index));
    };

    const handleSubmit = async () => {
        if(files.length === 0) return;

        try{
            for (const file of files){
                const storageRef = ref(storage, 'documents/${user?.uid}/${file.name}');
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);

                await addDoc(collection(db, 'documents'), {
                    name: file.name,
                    url: downloadURL,
                    prompt: prompt,
                    userId: user?.uid,
                    createdAt: serverTimestamp(),
                });
            }
            router.push('/documents');
        }catch(e){
            console.error(e);
        }
    }

    return(
        <main className="flex-grow">
            <section className="relative pt-5 pb-32 px-6 overflow-hidden">
                <div className="flex gap-8 relative z-10 items-start">
                    <Aside/>
                    <div>
                        <h1 className="font-headline text-3xl font-bold text-on-background">Generate</h1>
                    </div>
                    <div className="flex-1 text-center items-center flex-col pt-20">
                    <div className="max-w-2xl w-full p-2 rounded-xl neomorph-raised bg-surface-container-low group cursor-pointer transition-all duration-300 hover:scale-[1.01]">
                        <div className="border-2 border-dashed border-outline-variant rounded-lg p-12 neomorph-sunken flex flex-col items-center justify-center gap-4 bg-surface-bright">
                            <h3 className="font-headline text-xl font-bold text-on-surface">Upload your files here</h3>
                            <p className="text-on-surface-variant font-body">Support for (needs to be decided)</p>
                            <button type="button" 
                            onClick={() => inputRef.current?.click()} 
                            className="mt-4 px-8 py-3 bg-white border border-outline-variant rounded-lg font-semibold text-primary neomorph-raised hover:bg-surface-container transition-all active:scale-95">
                            Browse Files
                            </button>
                            <input ref={inputRef} type="file" multiple className="hidden" onChange={handleBrowse} />
                        </div>
                            {files.length > 0 && (<div className="mt-4 space-y-2"> 
                                {files.map((file,index) => (<div key={index} className = "flex items-center justify-between bg-surface-container rounded-lg px-4 py-2"> 
                                    <span className="text-sm text-on-surface truncate">{file.name}</span> 
                                    <button type="button" onClick={() => removeFile(index)} className="text-on-surface-variant hover:text-error ml-4 text-xs">Remove</button> 
                                    </div>))
                                } 
                                </div>)
                            }
                    </div>
                    <div className="max-w-2xl neomorph-sunken bg-surface-container-low my-8 px-4 py-8 rounded-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-outline text-[40px]"></span>
                        <input 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="bg-transparent border-none text-sm font-label outline-none placeholder:text-outline w-full h-8" placeholder="Input an additional prompt here" type="text"/>
                    </div>
                <div className="max-w-2xl flex flex-col items-center justify-center gap-4">
                    <button 
                    onClick={handleSubmit}
                    className="mt-4 px-8 py-3 bg-primary border border-outline-variant rounded-lg font-semibold text-white neomorph-raised hover:brightness-110 transition-all active:scale-95 justify-center">
                        Submit
                    </button>
                    </div>
                </div>
            </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-full -z-10 opacity-40 pointer-events-none">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-fixed-dim rounded-full blur-[100px]"></div>
                <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-secondary-fixed rounded-full blur-[80px]"></div>
                </div>
                </section>
            </main>
    )
}
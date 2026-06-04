"use client"
import { useState } from "react";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { useSignInWithGoogle } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";

export default function SignUp(){
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [createUserWithEmailAndPassword] = useCreateUserWithEmailAndPassword(auth);
    const [createUserWithGoogle] = useSignInWithGoogle(auth);
    const router = useRouter();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try{
            const res = await createUserWithEmailAndPassword(email, password);
            if(!res){
                setError('Failed to create account');
                return;
            }
            console.log({res});
            setEmail('');
            setPassword('');
            router.push('/generate');
        }catch(e){
            console.error(e);
            setError('Something went wrong. Please try again.');
        }
    };

    const handleGoogleSignUp = async () => {
        try{
            const res = await createUserWithGoogle();
            if(!res) return;
            router.push('/generate');
        }catch(e){
            console.error(e);
        }
    }

    return(
            <main className ="flex-grow flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
            <div className ="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 blur-[120px] rounded-full"></div>
            <div className ="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary/5 blur-[120px] rounded-full"></div>
            <div className ="w-full max-w-md relative z-10">
                <div className ="text-center mb-10">
                    <h1 className ="font-display text-5xl font-extrabold text-primary mb-2">BluEdu</h1>
                </div>
                <div className ="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 md:p-10 shadow-xl">
                    <div className ="mb-8">
                        <h2 className ="font-display text-2xl font-bold text-on-surface mb-2">Welcome!</h2>
                        <p className ="text-sm text-on-surface-variant">Please enter an email and password to sign up for BluEdu. Your password must be at least 6 digits or else your account will not be created.</p>
                    </div>
                    <form className ="space-y-6" onSubmit={handleSignUp}>
                    <div>
                        <label className ="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 ml-1" htmlFor="email">Email Address</label>
                            <div className ="relative group">
                                <input value={email} onChange={(e) => setEmail(e.target.value)} className ="w-full bg-surface-container-low border border-outline-variant rounded-lg py-3 px-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none" id="email" placeholder="name@company.com" type="email"/>
                            </div>
                    </div>
                    <div>
                        <label className ="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 ml-1" htmlFor="password">Password</label>
                            <div className ="relative group">
                                <input value={password} onChange={(e) => setPassword(e.target.value)} className ="w-full bg-surface-container-low border border-outline-variant rounded-lg py-3 px-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none" id = "password" placeholder="••••••••" type="password"/>
                            </div>
                            <div className ="flex justify-end mt-2">
                            </div>
                    </div>
                    {error && (<p className="text-red-500 text-sm text-center">{error}</p>)}
                    <button className ="w-full bg-primary text-on-primary font-bold py-3.5 rounded-lg active:scale-[0.98] transition-all duration-200 mt-2 shadow-lg shadow-primary/20 hover:brightness-110 cursor-pointer" type="submit"> Create account </button>
                    <button className ="w-full bg-on-secondary-fixed-variant text-on-primary font-bold py-3.5 rounded-lg active:scale-[0.98] transition-all duration-200 mt-2 shadow-lg shadow-primary/20 hover:brightness-110 cursor-pointer" type="button" onClick={handleGoogleSignUp}> Create account with Google </button>
                    </form>
                    <div className ="mt-10 text-center">
            </div>
            </div>
            </div>
            </main>
    )
}
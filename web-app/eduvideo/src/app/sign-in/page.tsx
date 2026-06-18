"use client"
import { useState } from "react";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { useSignInWithGoogle } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from 'next/navigation';

export default function SignIn() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [signInWithEmailAndPassword] = useSignInWithEmailAndPassword(auth);
    const [signInWithGoogle] = useSignInWithGoogle(auth);
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState('');
    const [showPass, setPass] = useState(false);

    const getError = async (errorCode: string, email: string) => {
        if (errorCode === 'auth/invalid-credential') {
            try {
                const res = await fetch('/api/emailCheck', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });
                const data = await res.json();
                return data.exists
                    ? 'Incorrect password. Please try again.'
                    : 'No account found with this email. If you do not have an account and would like one, please sign up.';
            } catch {
                return 'Incorrect password. Please try again.';
            }
        }
        switch (errorCode) {
            default:
                return 'Something went wrong. Please try again.'
        }
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        try {
            const res = await signInWithEmailAndPassword(email, password);
            if (!res) {
                const message = await getError('auth/invalid-credential', email); // ← hardcode the code
                setErrorMessage(message ?? 'Something went wrong. Please try again.');
                return;
            }
            setEmail('');
            setPassword('');
            router.push('/generate');
        } catch (e: any) {
            const message = await getError(e?.code ?? 'unknown', email);
            setErrorMessage(message ?? 'Something went wrong. Please try again.');
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const res = await signInWithGoogle();
            if (!res) return;
            router.push('/generate');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <main className="flex-grow flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary/5 blur-[120px] rounded-full"></div>
            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <h1 className="font-display text-5xl font-extrabold text-primary mb-2">BluEdu</h1>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 md:p-10 shadow-xl">
                    <div className="mb-8">
                        <h2 className="font-display text-2xl font-bold text-on-surface mb-2">Welcome Back</h2>
                        <p className="text-sm text-on-surface-variant">Please sign in to start uploading documents and creating videos.</p>
                    </div>
                    <form className="space-y-6" onSubmit={handleSignIn}>
                        <div>
                            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 ml-1" htmlFor="email">Email Address</label>
                            <div className="relative group">
                                <input value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-3 px-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none" id="email" placeholder="name@company.com" type="email" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 ml-1" htmlFor="password">Password</label>
                            <div className="relative group">
                                <input value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    type={showPass ? 'text' : 'password'}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-3 px-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none" id="password" placeholder="••••••••" />
                                    <button 
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                                        onClick={() => setPass(prev => !prev)}
                                        type="button"
                                        >
                                            <span className="material-symbols-outlined text-sm">
                                                {showPass ? 'visibility' : 'visibility_off'}
                                            </span>
                                    </button>
                            </div>
                            <div className="flex justify-end mt-2">
                                <a className="text-primary text-sm font-bold hover:underline ml-1 cursor-pointer" href="/forgot-password">Forgot password?</a>
                            </div>
                        </div>
                        {errorMessage && (
                            <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg px-4 py-3">
                                {errorMessage}
                            </div>
                        )}
                        <button className="w-full bg-primary text-on-primary font-bold py-3.5 rounded-lg active:scale-[0.98] transition-all duration-200 mt-2 shadow-lg shadow-primary/20 hover:brightness-110 cursor-pointer" type="submit"> Sign In </button>
                        <button className="w-full bg-tertiary-container text-on-primary font-bold py-3.5 rounded-lg active:scale-[0.98] transition-all duration-200 mt-2 shadow-lg shadow-primary/10 hover:brightness-110 cursor-pointer" type="button" onClick={handleGoogleSignIn}> Sign In With Google Account </button>
                    </form>
                    <div className="mt-10 text-center">
                        <p className="text-sm text-on-surface-variant font-medium"> Don't have an account? <a className="text-primary font-bold hover:underline ml-1" href="/sign-up">Sign Up</a></p>
                    </div>
                </div>
            </div>
        </main>
    )
}
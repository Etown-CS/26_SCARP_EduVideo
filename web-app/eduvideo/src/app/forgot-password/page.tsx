"use client"

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/app/firebase/config";

export default function forgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Password reset email sent. Please check your email.');
        } catch (e: any) {
            switch (e?.code) {
                case 'auth/user-not-found':
                case 'auth/invalid-email':
                    setError('No account found with that email. If you would like to create an account, please sign up.');
                    break;
                default:
                    setError('Something went wrong. Please try again.');
            }
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
                        <h2 className="font-display text-2xl font-bold text-on-surface mb-2">Reset Password</h2>
                        <p className="text-sm text-on-surface-variant">Enter your email and we will send you a link to reset your password. Make sure to check your spam folder.</p>
                    </div>
                    <form className="space-y-6" onSubmit={handleReset}>
                        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 ml-1" htmlFor="email">Email Address</label>
                        <div className="relative group">
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-3 px-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none"
                                id="email"
                                placeholder="name@company.com"
                                type="email" />
                        </div>
                        {error && (
                            <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg px-4 py-3">
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="bg-primary/10 border border-primary/30 text-primary text-sm rounded-lg px-4 py-3">
                                {message}
                            </div>
                        )}
                        <button className="w-full bg-primary text-on-primary font-bold py-3.5 rounded-lg active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/20 hover:brightness-110 cursor-pointer" type="submit">
                            Send Reset Email
                        </button>
                    </form>
                    <div className="mt-10 text-center">
                        <p className="text-sm text-on-surface-variant font-medium"> Don't have an account? <a className="text-primary font-bold hover:underline ml-1" href="/sign-up">Sign Up</a></p>
                    </div>
                </div>
            </div>
        </main>
    )
}
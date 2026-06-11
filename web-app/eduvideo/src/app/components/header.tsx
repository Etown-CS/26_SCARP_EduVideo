"use client"
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/app/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { useChat } from "../context/chatContext";
import { useTheme } from "next-themes";
import ThemeToggle from "./themetoggle";

export default function Header() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const { setMessages } = useChat();
  const { theme, setTheme } = useTheme();

  const handleSignOut = () => {
    signOut(auth);
    setMessages([{ sender: 'agent', text: 'How can I help?' }]);
    router.push("/sign-in");
  };

  return (
    <header className="docked full-width top-0 z-50 bg-surface">
      <nav className="flex justify-between items-center w-full px-4 md:px-8 py-6">
        <div className="flex items-center gap-12">
          <a className="font-display text-2xl font-extrabold text-primary tracking-tight" href="/">BluEdu</a>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-300 font-label text-sm uppercase tracking-wider" href="/documents">Documents</a>
            <a className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-300 font-label text-sm uppercase tracking-wider" href="/generate">Generate</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!loading && (user ? (
            <button onClick={handleSignOut}
              className="inline-block rounded-lg bg-primary px-6 py-2 text-on-primary text-sm font-semibold hover:brightness-110 transition-colors active:scale-95 transform duration-200 cursor-pointer"> Sign Out </button>
          ) : (
            <Link href="/sign-in" className="inline-block rounded-lg bg-primary px-6 py-2 text-on-primary text-sm font-semibold hover:brightness-110 transition-colors active:scale-95 transform duration-200 cursor-pointer"> Sign In </Link>
          )
          )
          }
          <ThemeToggle/>
        </div>
      </nav>
    </header>
  )
}
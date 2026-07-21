"use client"
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/app/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import { usePathname, useRouter } from "next/navigation";
import { useChat } from "../context/chatContext";
import ThemeToggle from "./themetoggle";
import { cleanupAbandoned, clearPipelineState } from "../lib/pipelineState";

const midPipelinePages = ['/generate/edit', '/generate/review', '/generate/final-video'];

export default function Header() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const { setMessages } = useChat();
  const pathname = usePathname();

  const handleClick = async (e: React.MouseEvent, href: string) => {
    if (midPipelinePages.includes(pathname) && !href.startsWith('/generate')) {
      e.preventDefault();
      const confirmed = window.confirm(
        "Starting a new upload will erase your video's current progress. Do you want to continue?"
      );
      if(confirmed){
        await cleanupAbandoned(user);
        clearPipelineState();
        router.push(href);
      }
    }
  };

  const navLinks = (href: string, label: string) => {
    const isActive = pathname === href || pathname.startsWith(href + '/');
    return (
      <a
        href={href}
        onClick={(e) => handleClick(e, href)}
        className={`font-medium transition-colors duration-300 font-label text-sm uppercase tracking-wider ${isActive
          ? 'text-primary border-b-2 border-primary pb-0.5'
          : 'text-on-surface-variant hover:text-primary'
          }`}
      >
        {label}
      </a>
    );
  }


  const handleSignOut = () => {
    signOut(auth);
    setMessages([{ sender: 'agent', text: 'How can I help?' }]);
    router.push("/sign-in");
  };

  return (
    <header className="docked full-width top-0 z-50 bg-surface shadow-neomorph-raised">
      <nav className="flex justify-between items-center w-full px-4 md:px-8 py-6">
        <div className="flex items-center gap-12">
          <a className="font-display text-2xl font-extrabold text-primary tracking-tight" href="/" onClick={(e) => handleClick(e, '/')}>BluEdu</a>
          <div className="hidden md:flex items-center gap-8">
            {navLinks('/generate', 'Generate')}
            {navLinks('/documents', 'Documents')}
            {navLinks('/gallery', 'Gallery')}
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
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
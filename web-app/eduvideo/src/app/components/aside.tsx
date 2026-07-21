"use client"
import { usePathname, useRouter } from "next/navigation";
import { cleanupAbandoned, clearPipelineState } from "../lib/pipelineState";
import { auth } from "@/app/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";

const navLinks = [
    { href: "/generate", label: "Upload", span: "upload" },
    { href: "/generate/edit", label: "Edit", span: "edit_square" },
    { href: "/generate/review", label: "Review", span: "rate_review" },
    { href: "/generate/final-video", label: "Final Video", span: "movie_filter" }
]

const midPipelinePages = ['/generate/edit', '/generate/review', '/generate/final-video'];

export default function Aside() {

    const pathName = usePathname();
    const router = useRouter();
    const [user, loading] = useAuthState(auth);

    const handleClick = async (e: React.MouseEvent, href: string) => {
        if(href === '/generate' && midPipelinePages.includes(pathName)){
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

    return (
        <aside className="bg-surface-container-low w-60 h-128 flex flex-col p-4 gap-2 shadow-neomorph-raised rounded-2xl z-40">
            <div className="flex items-center gap-3 px-2 py-2 mb-4">
                <span className="material-symbols-outlined">video_frame_copy</span>
                <div>
                    <h2 className="font-headline text-lg font-bold text-on-surface">Video Workspace</h2>
                </div>
            </div>
            <nav className="flex-1 space-y-1">
                {
                    navLinks.map(({ href, label, span }) => {
                        const isActive = pathName === href;
                        return (
                            <a href={href} key={href} onClick={(e) => handleClick(e, href)}>
                                <div className={
                                    isActive
                                        ? "ems-center gap-3 px-3 py-3 flex items-center bg-primary-container text-on-primary-container rounded-lg cursor-pointer active:scale-[0.98]"
                                        : "text-on-surface-variant hover:bg-surface-container-high transition-all flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:translate-x-1 duration-200"
                                }
                                >
                                    <span className="material-symbols-outlined text-sm">{span}</span>
                                    <span className="font-body text-body-md tracking-wide">{label}</span>
                                </div>
                            </a>
                        );
                    })
                }
            </nav>
        </aside>
    )
}
export default function Aside(){
    return(
        <aside className="flex flex-col h-full p-4 gap-2 bg-surface-container-low w-72 shadow-[4px_0_24px_-4px_rgba(218,226,253,0.5)] z-40 shrink-0 rounded-xl">
            <div className="flex items-center gap-3 px-2 py-4 mb-4">
                <div>
                    <h2 className="font-headline text-lg font-bold text-on-surface leading-tight">Video Workspace</h2>
                </div>
            </div>
            <nav className="flex-1 space-y-1">
                <a href = "/generate"><div className="text-on-surface-variant hover:bg-surface-container-high transition-all flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:translate-x-1 duration-200">
                    <span className="font-body text-body-md">Upload</span>
                </div></a>
                <a href = '/generate'><div className="text-on-surface-variant hover:bg-surface-container-high transition-all flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:translate-x-1 duration-200">
                    <span className="font-body text-body-md">Edit</span>
                </div></a>
                <a href = '/generate'><div className="text-on-surface-variant hover:bg-surface-container-high transition-all flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:translate-x-1 duration-200">
                    <span className="font-body text-body-md">Review</span>
                </div></a>
                <a href = '/generate'><div className="text-on-surface-variant hover:bg-surface-container-high transition-all flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:translate-x-1 duration-200">
                    <span className="font-body text-body-md">Final Video</span>
                </div></a>
            </nav>
            <div className="pt-4 border-t border-outline-variant/30 space-y-1">
        </div>
    </aside>
    )
}
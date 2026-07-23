import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const THEMES = ["light", "dark", "party"] as const;
const ICONS: Record<typeof THEMES[number], string> = {
    light: "dark_mode",
    dark: "light_mode",
    party: "celebration",
};

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg bg-surface-container hover:brightness-110 transition-all cursor-pointer">
            <span className="material-symbols-outlined">
                {ICONS[theme as typeof THEMES[number]] ?? "dark_mode"}
            </span>
        </button>
    );
}
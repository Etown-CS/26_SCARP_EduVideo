"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";

export default function SecretToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const previousTheme = useRef<string>("light");

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;
    const isParty = theme === "party";

    const handleToggle = () => {
        if (isParty) {
            setTheme(previousTheme.current);
        } else {
            previousTheme.current = theme ?? "light";
            setTheme("party");
        }
    };

    return (
        <button onClick={handleToggle}
            className="font-display text-2xl font-bold text-primary cursor-pointer">
            BluEdu
        </button>
    );
}
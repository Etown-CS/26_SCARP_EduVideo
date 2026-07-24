"use client"

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { fireConfetti } from "@/app/lib/confetti";

export default function PartyConfetti(){
    const {theme} = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if(!mounted || theme !== "party") return;
        const handleClick = (e: MouseEvent) => {
            fireConfetti(e.clientX, e.clientY);
        };
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, [mounted, theme]);
    return null;
}
"use client";

import { useEffect, useRef, useState } from "react";

export function useInView(threshold = 0.2) {
    const ref = useRef<HTMLElement>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) setInView(true);
            },
            { threshold },
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return { ref, inView };
}

/** Runs 1 → stages when `active` becomes true (e.g. section scrolls into view). */
export function useStagedReveal(active: boolean, stages: number, gapMs = 480) {
    const [stage, setStage] = useState(0);

    useEffect(() => {
        if (!active) {
            setStage(0);
            return;
        }

        setStage(1);
        const timers: ReturnType<typeof setTimeout>[] = [];
        for (let i = 2; i <= stages; i++) {
            timers.push(setTimeout(() => setStage(i), gapMs * (i - 1)));
        }

        return () => timers.forEach(clearTimeout);
    }, [active, stages, gapMs]);

    return stage;
}

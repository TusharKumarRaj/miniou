"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { LANDING_ASSETS } from "~/components/landing/landing-assets";

export function useHeroFigure() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return LANDING_ASSETS.heroFigure;
    }

    return resolvedTheme === "light" ? LANDING_ASSETS.heroFigureLight : LANDING_ASSETS.heroFigure;
}

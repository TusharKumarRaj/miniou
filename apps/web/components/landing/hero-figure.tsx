"use client";

import { cn } from "~/lib/cn";
import { useHeroFigure } from "~/lib/use-hero-figure";

type HeroFigureProps = {
    className?: string;
};

export function HeroFigure({ className }: HeroFigureProps) {
    const src = useHeroFigure();

    return (
        <div
            role="img"
            aria-label="Hero figure"
            className={cn(
                "h-full w-full bg-background bg-contain bg-center bg-no-repeat",
                className,
            )}
            style={{ backgroundImage: `url("${src}")` }}
        />
    );
}

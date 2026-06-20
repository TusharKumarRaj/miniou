"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "~/lib/cn";

type ImageSlotProps = {
    src: string;
    alt: string;
    label: string;
    className?: string;
    imageClassName?: string;
    priority?: boolean;
    unoptimized?: boolean;
    fill?: boolean;
    width?: number;
    height?: number;
};

export function ImageSlot({
    src,
    alt,
    label,
    className,
    imageClassName,
    priority,
    unoptimized,
    fill,
    width,
    height,
}: ImageSlotProps) {
    const [missing, setMissing] = useState(false);

    if (missing) {
        return (
            <div
                className={cn(
                    "flex flex-col items-center justify-center border border-dashed border-border bg-surface text-center",
                    className,
                )}
            >
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-dim">
                    Awaiting asset
                </span>
                <span className="mt-1 font-mono text-[11px] text-muted">{label}</span>
            </div>
        );
    }

    if (fill) {
        return (
            <div className={cn("relative", className)}>
                <Image
                    src={src}
                    alt={alt}
                    fill
                    priority={priority}
                    unoptimized={unoptimized}
                    sizes="(max-width: 768px) 90vw, 480px"
                    className={cn("object-contain", imageClassName)}
                    onError={() => setMissing(true)}
                />
            </div>
        );
    }

    return (
        <div className={cn("relative", className)}>
            <Image
                src={src}
                alt={alt}
                width={width ?? 800}
                height={height ?? 1000}
                priority={priority}
                className={cn("h-full w-full object-contain", imageClassName)}
                onError={() => setMissing(true)}
            />
        </div>
    );
}

"use client";

import { Permanent_Marker } from "next/font/google";
import { useLayoutEffect, useRef } from "react";
import rough from "roughjs";

const sketchFont = Permanent_Marker({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-coachmark-sketch",
});

export { sketchFont };

type Point = { x: number; y: number };

type SketchArrowProps = {
    from: Point;
    to: Point;
};

export function SketchArrow({ from, to }: SketchArrowProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useLayoutEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        svg.innerHTML = "";
        const rc = rough.svg(svg);

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.hypot(dx, dy) || 1;
        const endX = to.x - (dx / distance) * 10;
        const endY = to.y - (dy / distance) * 10;

        const midX = (from.x + endX) / 2;
        const midY = (from.y + endY) / 2;
        const curveX = midX + dy * 0.18;
        const curveY = midY - dx * 0.18;

        const path = `M ${from.x} ${from.y} Q ${curveX} ${curveY} ${endX} ${endY}`;
        svg.appendChild(
            rc.path(path, {
                stroke: "#ffffff",
                strokeWidth: 2,
                roughness: 1.6,
                bowing: 1.4,
            }),
        );

        const angle = Math.atan2(endY - curveY, endX - curveX);
        const headLength = 14;
        const leftX = endX - headLength * Math.cos(angle - Math.PI / 7);
        const leftY = endY - headLength * Math.sin(angle - Math.PI / 7);
        const rightX = endX - headLength * Math.cos(angle + Math.PI / 7);
        const rightY = endY - headLength * Math.sin(angle + Math.PI / 7);

        svg.appendChild(
            rc.line(endX, endY, leftX, leftY, {
                stroke: "#ffffff",
                strokeWidth: 2,
                roughness: 1.4,
                bowing: 1,
            }),
        );
        svg.appendChild(
            rc.line(endX, endY, rightX, rightY, {
                stroke: "#ffffff",
                strokeWidth: 2,
                roughness: 1.4,
                bowing: 1,
            }),
        );
    }, [from.x, from.y, to.x, to.y]);

    return (
        <svg
            ref={svgRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden
        />
    );
}

type SketchRingProps = {
    center: Point;
    width: number;
    height: number;
};

export function SketchRing({ center, width, height }: SketchRingProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useLayoutEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        svg.innerHTML = "";
        const rc = rough.svg(svg);
        const padding = 10;

        svg.appendChild(
            rc.rectangle(
                center.x - width / 2 - padding,
                center.y - height / 2 - padding,
                width + padding * 2,
                height + padding * 2,
                {
                    stroke: "#ffffff",
                    strokeWidth: 2,
                    roughness: 1.8,
                    bowing: 1.2,
                    fill: "rgba(255, 255, 255, 0.04)",
                    fillStyle: "solid",
                },
            ),
        );
    }, [center.x, center.y, width, height]);

    return (
        <svg
            ref={svgRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden
        />
    );
}

type SketchDividerProps = {
    x: number;
    y: number;
    width: number;
};

export function SketchDivider({ x, y, width }: SketchDividerProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useLayoutEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        svg.innerHTML = "";
        const rc = rough.svg(svg);

        svg.appendChild(
            rc.line(x, y, x + width, y, {
                stroke: "#ffffff",
                strokeWidth: 2,
                roughness: 1.5,
                bowing: 0.8,
            }),
        );
    }, [x, y, width]);

    return (
        <svg
            ref={svgRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden
        />
    );
}

export function sketchTextClassName() {
    return `${sketchFont.className} text-white tracking-wide`;
}

export function sketchTitleClassName() {
    return `${sketchTextClassName()} uppercase`;
}

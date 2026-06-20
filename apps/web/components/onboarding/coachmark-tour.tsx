"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";

import {
    SketchArrow,
    SketchDivider,
    SketchRing,
    sketchFont,
    sketchTextClassName,
    sketchTitleClassName,
} from "~/components/onboarding/coachmark-sketch";
import { hasCompletedCoachmarks, markCoachmarksCompleted } from "~/lib/coachmarks";

export type CoachmarkStep = {
    id: string;
    title: string;
    body: string;
};

type TargetRect = {
    top: number;
    left: number;
    width: number;
    height: number;
    bottom: number;
    right: number;
};

type AnnotationLayout = {
    target: { x: number; y: number };
    label: { x: number; y: number; width: number; maxWidth: number };
    arrowFrom: { x: number; y: number };
};

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function isElementVisible(element: Element) {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
}

function measureTarget(id: string): TargetRect | null {
    const element = document.querySelector(`[data-coachmark="${id}"]`);
    if (!element || !isElementVisible(element)) return null;

    const rect = element.getBoundingClientRect();
    return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
    };
}

function layoutAnnotation(rect: TargetRect): AnnotationLayout {
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 24;
    const labelMaxWidth = Math.min(300, viewportWidth - margin * 2);

    const spaces = [
        { side: "top" as const, value: rect.top },
        { side: "bottom" as const, value: viewportHeight - rect.bottom },
        { side: "left" as const, value: rect.left },
        { side: "right" as const, value: viewportWidth - rect.right },
    ].sort((a, b) => b.value - a.value);

    const side = spaces[0]?.side ?? "bottom";
    let labelX = margin;
    let labelY = margin + 72;

    switch (side) {
        case "top":
            labelX = clamp(targetX - labelMaxWidth / 2, margin, viewportWidth - labelMaxWidth - margin);
            labelY = Math.max(margin + 72, rect.top - 120);
            break;
        case "bottom":
            labelX = clamp(targetX - labelMaxWidth / 2, margin, viewportWidth - labelMaxWidth - margin);
            labelY = Math.min(viewportHeight - 160, rect.bottom + 28);
            break;
        case "left":
            labelX = Math.max(margin, rect.left - labelMaxWidth - 20);
            labelY = clamp(targetY - 48, margin + 72, viewportHeight - 160);
            break;
        case "right":
            labelX = Math.min(viewportWidth - labelMaxWidth - margin, rect.right + 20);
            labelY = clamp(targetY - 48, margin + 72, viewportHeight - 160);
            break;
    }

    const arrowFromX = clamp(labelX + labelMaxWidth / 2, margin, viewportWidth - margin);
    const arrowFromY = side === "top" ? labelY + 72 : labelY - 8;

    return {
        target: { x: targetX, y: targetY },
        label: { x: labelX, y: labelY, width: labelMaxWidth, maxWidth: labelMaxWidth },
        arrowFrom: {
            x: arrowFromX,
            y: side === "top" ? labelY + 76 : labelY - 4,
        },
    };
}

type CoachmarkTourProps = {
    steps: CoachmarkStep[];
    storageKey: string;
    ready?: boolean;
};

export function CoachmarkTour({ steps, storageKey, ready = true }: CoachmarkTourProps) {
    const [open, setOpen] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const [stepIndex, setStepIndex] = useState(0);
    const [availableSteps, setAvailableSteps] = useState<CoachmarkStep[]>([]);
    const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
    const [layout, setLayout] = useState<AnnotationLayout | null>(null);

    const currentStep = availableSteps[stepIndex] ?? null;
    const isLastStep = stepIndex >= availableSteps.length - 1;
    const sketchText = sketchTextClassName();
    const sketchTitle = sketchTitleClassName();

    const finish = useCallback(() => {
        markCoachmarksCompleted(storageKey);
        setOpen(false);
    }, [storageKey]);

    const updateLayout = useCallback(() => {
        if (!currentStep || showIntro) {
            setTargetRect(null);
            setLayout(null);
            return;
        }

        const element = document.querySelector(`[data-coachmark="${currentStep.id}"]`);
        element?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });

        window.requestAnimationFrame(() => {
            const rect = measureTarget(currentStep.id);
            if (!rect) {
                setTargetRect(null);
                setLayout(null);
                return;
            }

            setTargetRect(rect);
            setLayout(layoutAnnotation(rect));
        });
    }, [currentStep, showIntro]);

    useEffect(() => {
        if (!ready || hasCompletedCoachmarks(storageKey)) return;

        const timer = window.setTimeout(() => {
            const visibleSteps = steps.filter((step) => measureTarget(step.id));
            if (visibleSteps.length > 0) {
                setAvailableSteps(visibleSteps);
                setStepIndex(0);
                setShowIntro(true);
                setOpen(true);
            }
        }, 600);

        return () => window.clearTimeout(timer);
    }, [ready, steps, storageKey]);

    useLayoutEffect(() => {
        if (!open || showIntro || !currentStep) return;
        updateLayout();
    }, [open, showIntro, currentStep, stepIndex, updateLayout]);

    useEffect(() => {
        if (!open) return;

        function handleReposition() {
            updateLayout();
        }

        window.addEventListener("resize", handleReposition);
        window.addEventListener("scroll", handleReposition, true);

        return () => {
            window.removeEventListener("resize", handleReposition);
            window.removeEventListener("scroll", handleReposition, true);
        };
    }, [open, updateLayout]);

    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    function handleAdvance() {
        if (showIntro) {
            setShowIntro(false);
            return;
        }

        if (isLastStep) {
            finish();
            return;
        }

        setStepIndex((index) => index + 1);
    }

    if (!open || availableSteps.length === 0) {
        return null;
    }

    return (
        <div
            className={`fixed inset-0 z-[10050] ${sketchFont.variable}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={showIntro ? "coachmark-intro-title" : "coachmark-step-title"}
            aria-describedby={showIntro ? "coachmark-intro-hint" : "coachmark-step-body"}
        >
            <button
                type="button"
                className="absolute inset-0 bg-black/72 transition"
                aria-label={showIntro || !isLastStep ? "Continue tutorial" : "Dismiss tutorial"}
                onClick={handleAdvance}
            />

            <button
                type="button"
                onClick={finish}
                className={`${sketchTitle} absolute right-5 top-5 z-[10052] text-sm opacity-80 transition hover:opacity-100`}
            >
                Skip
            </button>

            {!showIntro && layout && targetRect ? (
                <>
                    <SketchRing
                        center={layout.target}
                        width={targetRect.width}
                        height={targetRect.height}
                    />
                    <SketchArrow from={layout.arrowFrom} to={layout.target} />

                    <div
                        className="pointer-events-none absolute z-[10051]"
                        style={{
                            top: layout.label.y,
                            left: layout.label.x,
                            width: layout.label.maxWidth,
                        }}
                    >
                        <p
                            id="coachmark-step-title"
                            className={`${sketchTitle} text-xl leading-tight sm:text-2xl`}
                        >
                            {currentStep?.title}
                        </p>
                        <p
                            id="coachmark-step-body"
                            className={`${sketchText} mt-3 text-sm leading-snug opacity-95 sm:text-base`}
                        >
                            {currentStep?.body}
                        </p>
                    </div>
                </>
            ) : null}

            {showIntro ? (
                <div className="pointer-events-none absolute inset-x-0 top-[18%] z-[10051] flex flex-col items-center px-6 text-center">
                    <h2 id="coachmark-intro-title" className={`${sketchTitle} text-3xl sm:text-4xl`}>
                        Quick tutorial
                    </h2>
                    <div className="relative mt-5 h-6 w-[220px]">
                        <SketchDivider x={0} y={10} width={220} />
                    </div>
                    <p
                        id="coachmark-intro-hint"
                        className={`${sketchTitle} mt-4 text-sm opacity-90 sm:text-base`}
                    >
                        Tap to continue
                    </p>
                    <p className={`${sketchText} mt-6 max-w-md text-sm leading-snug opacity-80 sm:text-base`}>
                        A quick walkthrough of chat, mail, calendar, and the tools around them.
                    </p>
                </div>
            ) : (
                <p
                    className={`${sketchTitle} pointer-events-none absolute inset-x-0 bottom-8 z-[10051] text-center text-sm opacity-90 sm:text-base`}
                >
                    {isLastStep ? "Tap to dismiss" : "Tap to continue"}
                </p>
            )}
        </div>
    );
}

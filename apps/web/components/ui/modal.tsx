"use client";

import { MiniouPanel } from "~/components/ui/miniou";
import { cn } from "~/lib/cn";

type ModalProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
};

export function MiniouModal({ open, onClose, title, children, className }: ModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Close dialog"
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                onClick={onClose}
            />
            <MiniouPanel
                glow
                className={cn(
                    "relative z-10 max-h-[min(90vh,640px)] w-full max-w-md overflow-y-auto",
                    className,
                )}
            >
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-2 py-1 text-muted transition hover:bg-muted-surface hover:text-foreground"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </MiniouPanel>
        </div>
    );
}

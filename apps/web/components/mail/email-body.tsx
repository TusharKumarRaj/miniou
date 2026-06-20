"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { htmlToPlainText, isConversationalReply, parseReplyPlainText } from "~/components/mail/mail-utils";

type EmailBodyProps = {
    bodyHtml?: string;
    bodyText?: string;
    fallback?: string;
};

function wrapHtmlDocument(html: string) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><base target="_blank" rel="noopener noreferrer"><meta name="color-scheme" content="light"><style>
html, body { margin: 0; padding: 0; overflow: hidden !important; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: #1a1a1a; background: #ffffff; word-break: break-word; }
a { color: #1a73e8; }
img { max-width: 100%; height: auto; }
table { max-width: 100%; }
blockquote { margin: 0.5rem 0 0.5rem 0.8rem; padding-left: 0.8rem; border-left: 2px solid #ccc; color: #5f6368; }
.gmail_quote, .gmail_attr { color: #5f6368; }
.gmail_quote blockquote { margin: 0.5rem 0 0.5rem 0.8rem; padding-left: 0.8rem; border-left: 2px solid #ccc; }
pre { white-space: pre-wrap; }
</style></head><body>${html}</body></html>`;
}

function HtmlEmailFrame({ html }: { html: string }) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [height, setHeight] = useState(1);

    const syncHeight = useCallback(() => {
        const doc = iframeRef.current?.contentDocument;
        if (!doc) return;

        const nextHeight = Math.max(
            doc.body?.scrollHeight ?? 0,
            doc.documentElement?.scrollHeight ?? 0,
        );

        if (nextHeight > 0) {
            setHeight(nextHeight);
        }
    }, []);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        let resizeObserver: ResizeObserver | null = null;
        const imageListeners: Array<{
            img: HTMLImageElement;
            load: () => void;
            error: () => void;
        }> = [];

        const handleLoad = () => {
            syncHeight();

            const doc = iframe.contentDocument;
            if (!doc?.body) return;

            resizeObserver?.disconnect();
            resizeObserver = new ResizeObserver(syncHeight);
            resizeObserver.observe(doc.body);

            for (const image of doc.images) {
                if (!image.complete) {
                    const load = () => syncHeight();
                    const error = () => syncHeight();
                    image.addEventListener("load", load);
                    image.addEventListener("error", error);
                    imageListeners.push({ img: image, load, error });
                }
            }
        };

        iframe.addEventListener("load", handleLoad);
        return () => {
            iframe.removeEventListener("load", handleLoad);
            resizeObserver?.disconnect();
            for (const { img, load, error } of imageListeners) {
                img.removeEventListener("load", load);
                img.removeEventListener("error", error);
            }
        };
    }, [html, syncHeight]);

    return (
        <iframe
            ref={iframeRef}
            sandbox="allow-same-origin"
            title="Email content"
            srcDoc={wrapHtmlDocument(html)}
            scrolling="no"
            className="block w-full border-0 bg-white"
            style={{ height, overflow: "hidden" }}
        />
    );
}

function QuoteHeader({ line }: { line: string }) {
    const parts = line.split(/(<[^>]+>)/g);

    return (
        <p className="text-sm text-muted">
            {parts.map((part, index) => {
                if (part.startsWith("<") && part.endsWith(">")) {
                    const email = part.slice(1, -1);
                    return (
                        <a
                            key={`${part}-${index}`}
                            href={`mailto:${email}`}
                            className="text-[#8ab4f8] hover:underline"
                        >
                            {part}
                        </a>
                    );
                }
                return <span key={`${part}-${index}`}>{part}</span>;
            })}
        </p>
    );
}

function PlainReplyBody({ text }: { text: string }) {
    const { replyText, quoteHeader, quotedText } = parseReplyPlainText(text);

    if (!quoteHeader) {
        return (
            <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground/90">{text}</div>
        );
    }

    return (
        <div className="mt-4 text-sm leading-6 text-foreground/90">
            {replyText ? <p className="whitespace-pre-wrap">{replyText}</p> : null}
            <div className={replyText ? "mt-4" : undefined}>
                <QuoteHeader line={quoteHeader} />
                {quotedText ? (
                    <blockquote className="mt-2 border-l-2 border-white/25 pl-3 text-muted whitespace-pre-wrap">
                        {quotedText}
                    </blockquote>
                ) : null}
            </div>
        </div>
    );
}

export function EmailBody({ bodyHtml, bodyText, fallback }: EmailBodyProps) {
    const text = bodyText?.trim() || fallback?.trim() || "";
    const html = bodyHtml?.trim() ?? "";
    const useDarkReply = isConversationalReply(text, html);

    if (html && !useDarkReply) {
        return (
            <div className="mt-4 overflow-hidden rounded-lg bg-white">
                <HtmlEmailFrame html={html} />
            </div>
        );
    }

    const displayText = text || (html ? htmlToPlainText(html) : "");

    if (!displayText) {
        return <p className="mt-4 text-sm text-muted">No message body.</p>;
    }

    return <PlainReplyBody text={displayText} />;
}

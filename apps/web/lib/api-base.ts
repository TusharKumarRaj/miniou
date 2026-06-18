import { env } from "~/env.js";

export function getApiBaseUrl() {
    const trpcUrl = env.NEXT_PUBLIC_API_URL ?? "/trpc";

    if (trpcUrl.startsWith("http")) {
        return trpcUrl.replace(/\/trpc\/?$/, "");
    }

    if (typeof window !== "undefined") {
        return window.location.origin;
    }

    return "";
}

export function getGoogleLoginUrl() {
    return `${getApiBaseUrl()}/api/auth/google`;
}

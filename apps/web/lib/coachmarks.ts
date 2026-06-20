export const CHAT_COACHMARKS_STORAGE_KEY = "miniou.chat.coachmarks.completed";

export function hasCompletedCoachmarks(key: string) {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(key) === "true";
}

export function markCoachmarksCompleted(key: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, "true");
}

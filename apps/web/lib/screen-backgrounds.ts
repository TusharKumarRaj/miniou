export type ScreenBackground = "landing" | "signin" | "signup" | "gmail" | "calendar" | "app";

export const SCREEN_BACKGROUNDS: Record<
    ScreenBackground,
    { image: string; imageOpacity: string; overlay: string }
> = {
    landing: {
        image: "/miniou_mascot.svg",
        imageOpacity: "opacity-100",
        overlay: "bg-gradient-to-b from-black/40 via-transparent to-black/80",
    },
    signin: {
        image: "/miniou_signin.svg",
        imageOpacity: "opacity-100",
        overlay: "bg-gradient-to-b from-black/40 via-black/55 to-black/85",
    },
    signup: {
        image: "/signup_miniou.svg",
        imageOpacity: "opacity-100",
        overlay: "bg-gradient-to-b from-black/40 via-black/55 to-black/85",
    },
    gmail: {
        image: "/gmail_miniou.svg",
        imageOpacity: "opacity-100",
        overlay: "bg-gradient-to-b from-black/22 via-black/32 to-black/50",
    },
    calendar: {
        image: "/calendar_miniou.svg",
        imageOpacity: "opacity-100",
        overlay: "bg-gradient-to-b from-black/15 via-black/25 to-black/45",
    },
    app: {
        image: "/miniou_mascot.svg",
        imageOpacity: "opacity-[0.14]",
        overlay: "bg-gradient-to-b from-black/75 via-black/90 to-black",
    },
};

export function resolveScreenBackground(
    variant: "landing" | "app" | "auth",
    background?: ScreenBackground,
): ScreenBackground {
    if (background) return background;
    if (variant === "landing") return "landing";
    return "app";
}

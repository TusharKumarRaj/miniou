"use client";

import { MiniouButton } from "~/components/ui/miniou";
import { getGoogleLoginUrl } from "~/lib/api-base";

export function GoogleSignInButton({ label = "Continue with Google" }: { label?: string }) {
    return (
        <MiniouButton
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
                window.location.href = getGoogleLoginUrl();
            }}
        >
            {label}
        </MiniouButton>
    );
}

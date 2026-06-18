"use client";

import { useLoggedInUser } from "~/hooks/api/auth";

export function AuthSessionSync() {
    useLoggedInUser();
    return null;
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { GoogleSignInButton } from "~/components/auth/google-sign-in-button";
import { AppShell } from "~/components/layout/app-shell";
import {
    MiniouButton,
    MiniouInput,
    MiniouLink,
    MiniouPanel,
} from "~/components/ui/miniou";
import { useLoggedInUser, useSignUp } from "~/hooks/api/auth";

export default function SignUpPage() {
    const router = useRouter();
    const { data: user, isLoading: userLoading } = useLoggedInUser();
    const signUp = useSignUp();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (!userLoading && user) {
            router.replace("/mail");
        }
    }, [user, userLoading, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        await signUp.mutateAsync({ fullName, email, password });
        router.push("/settings/integrations");
    }

    return (
        <AppShell variant="auth">
            <MiniouPanel glow className="w-full max-w-sm p-7">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
                        <p className="mt-1 text-[13px] text-muted">Access your workspace</p>
                    </div>

                    <GoogleSignInButton label="Continue with Google" />

                    <div className="flex items-center gap-3 text-[12px] font-medium text-muted">
                        <span className="h-px flex-1 bg-border" />
                        or
                        <span className="h-px flex-1 bg-border" />
                    </div>

                    <MiniouInput
                        type="text"
                        placeholder="Full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                    />
                    <MiniouInput
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <MiniouInput
                        type="password"
                        placeholder="Password (min 8 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        required
                    />

                    {signUp.error && (
                        <p className="text-[13px] text-destructive">{signUp.error.message}</p>
                    )}

                    <MiniouButton type="submit" disabled={signUp.isPending} className="w-full">
                        {signUp.isPending ? "Creating…" : "Create account"}
                    </MiniouButton>

                    <p className="text-center text-[13px] text-muted">
                        Have an account?{" "}
                        <MiniouLink href="/login">Sign in</MiniouLink>
                    </p>
                </form>
            </MiniouPanel>
        </AppShell>
    );
}

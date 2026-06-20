"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { GoogleSignInButton } from "~/components/auth/google-sign-in-button";
import { AppShell } from "~/components/layout/app-shell";
import {
    MiniouButton,
    MiniouInput,
    MiniouLink,
    MiniouPanel,
} from "~/components/ui/miniou";
import { useLoggedInUser, useSignIn } from "~/hooks/api/auth";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: user, isLoading: userLoading } = useLoggedInUser();
    const signIn = useSignIn();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const urlError = searchParams.get("error");

    useEffect(() => {
        if (!userLoading && user) {
            router.replace("/mail");
        }
    }, [user, userLoading, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        await signIn.mutateAsync({ email, password });
        router.push("/settings/integrations");
    }

    const errorMessage = signIn.error?.message ?? urlError;

    return (
        <AppShell variant="auth">
            <MiniouPanel glow className="w-full max-w-sm p-7">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
                        <p className="mt-1 text-[13px] text-muted">Access your workspace</p>
                    </div>

                    <GoogleSignInButton />

                    <div className="flex items-center gap-3 text-[12px] font-medium text-muted">
                        <span className="h-px flex-1 bg-border" />
                        or
                        <span className="h-px flex-1 bg-border" />
                    </div>

                    <MiniouInput
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <MiniouInput
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {errorMessage && <p className="text-[13px] text-destructive">{errorMessage}</p>}

                    <MiniouButton type="submit" disabled={signIn.isPending} className="w-full">
                        {signIn.isPending ? "Signing in…" : "Continue"}
                    </MiniouButton>

                    <p className="text-center text-[13px] text-muted">
                        No account?{" "}
                        <MiniouLink href="/signup">Sign up</MiniouLink>
                    </p>
                </form>
            </MiniouPanel>
        </AppShell>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "~/components/layout/app-shell";
import {
    MiniouButton,
    MiniouInput,
    MiniouLink,
    MiniouPanel,
} from "~/components/ui/miniou";
import { useLoggedInUser, useSignIn } from "~/hooks/api/auth";

export default function LoginPage() {
    const router = useRouter();
    const { data: user, isLoading: userLoading } = useLoggedInUser();
    const signIn = useSignIn();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

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

    return (
        <AppShell variant="auth" background="signin">
            <MiniouPanel glow className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="space-y-4 p-8">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-miniou-red">
                            Welcome back
                        </p>
                        <h1 className="mt-1 text-2xl font-semibold">Sign in</h1>
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

                    {signIn.error && (
                        <p className="text-sm text-miniou-red">{signIn.error.message}</p>
                    )}

                    <MiniouButton type="submit" disabled={signIn.isPending} className="w-full">
                        {signIn.isPending ? "Signing in..." : "Sign in"}
                    </MiniouButton>

                    <p className="text-center text-sm text-white/50">
                        No account?{" "}
                        <MiniouLink href="/signup" className="no-underline hover:underline">
                            Sign up
                        </MiniouLink>
                    </p>
                </form>
            </MiniouPanel>
        </AppShell>
    );
}

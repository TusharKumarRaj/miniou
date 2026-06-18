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
    const [verificationSent, setVerificationSent] = useState(false);

    useEffect(() => {
        if (!userLoading && user) {
            router.replace("/mail");
        }
    }, [user, userLoading, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        await signUp.mutateAsync({ fullName, email, password });
        setVerificationSent(true);
    }

    if (verificationSent) {
        return (
            <AppShell variant="auth" background="signup">
                <MiniouPanel glow className="w-full max-w-md p-8 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-miniou-red">
                        Check your inbox
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold">Verify your email</h1>
                    <p className="mt-4 text-sm text-white/60">
                        We sent a verification link to <span className="text-white">{email}</span>.
                        Click it to activate your account, then sign in.
                    </p>
                    <MiniouLink href="/login" className="mt-6 inline-block no-underline hover:underline">
                        Back to sign in
                    </MiniouLink>
                </MiniouPanel>
            </AppShell>
        );
    }

    return (
        <AppShell variant="auth" background="signup">
            <MiniouPanel glow className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="space-y-4 p-8">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-miniou-red">
                            Get started
                        </p>
                        <h1 className="mt-1 text-2xl font-semibold">Create account</h1>
                    </div>

                    <GoogleSignInButton label="Sign up with Google" />

                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-white/35">
                        <span className="h-px flex-1 bg-white/10" />
                        <span>or</span>
                        <span className="h-px flex-1 bg-white/10" />
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
                        <p className="text-sm text-miniou-red">{signUp.error.message}</p>
                    )}

                    <MiniouButton type="submit" disabled={signUp.isPending} className="w-full">
                        {signUp.isPending ? "Creating account..." : "Sign up with email"}
                    </MiniouButton>

                    <p className="text-center text-sm text-white/50">
                        Already have an account?{" "}
                        <MiniouLink href="/login" className="no-underline hover:underline">
                            Sign in
                        </MiniouLink>
                    </p>
                </form>
            </MiniouPanel>
        </AppShell>
    );
}

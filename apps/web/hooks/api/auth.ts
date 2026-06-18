"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { trpc } from "~/trpc/client";

export function useSignUp() {
    const utils = trpc.useUtils();

    return trpc.auth.createUserWithEmailAndPassword.useMutation({
        onSuccess: async () => {
            await utils.auth.getLoggedInUserInfo.invalidate();
        },
    });
}

export function useSignIn() {
    const utils = trpc.useUtils();

    return trpc.auth.signInUserWithEmailAndPassword.useMutation({
        onSuccess: async () => {
            await utils.auth.getLoggedInUserInfo.invalidate();
        },
    });
}

export function useSignOut() {
    const utils = trpc.useUtils();

    return trpc.auth.signOut.useMutation({
        onSuccess: () => {
            utils.auth.getLoggedInUserInfo.setData(undefined, null);
        },
    });
}

export function useLoggedInUser() {
    return trpc.auth.getLoggedInUserInfo.useQuery(undefined, {
        retry: false,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

export function useRequireAuth() {
    const router = useRouter();
    const query = useLoggedInUser();

    useEffect(() => {
        if (!query.isLoading && !query.isFetching && query.isFetched && !query.data) {
            router.push("/login");
        }
    }, [query.isLoading, query.isFetching, query.isFetched, query.data, router]);

    return query;
}

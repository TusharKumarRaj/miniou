"use client";

import { trpc } from "~/trpc/client";

export function useIntegrationStatus() {
    return trpc.integration.getStatus.useQuery();
}

export function useConnectUrl() {
    const utils = trpc.useUtils();

    return trpc.integration.getConnectUrl.useMutation({
        onSuccess: () => {
            void utils.integration.getStatus.invalidate();
        },
    });
}

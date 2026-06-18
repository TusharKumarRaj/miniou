import { trpc } from "~/trpc/client";

export function useHealth() {
    const { data, error, isFetched, isFetching, isLoading, status } =
        trpc.health.getHealth.useQuery();

    return {
        data,
        error,
        isFetched,
        isFetching,
        isLoading,
        status,
    };
}

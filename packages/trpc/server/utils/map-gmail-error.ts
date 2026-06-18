import { TRPCError } from "@trpc/server";

export function mapGmailError(err: unknown): never {
    if (err instanceof TRPCError) {
        throw err;
    }

    if (err instanceof Error) {
        if (err.message.includes("Connect Gmail")) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: err.message });
        }

        if (
            err.message.includes("client_id not configured") ||
            err.message.includes("unable to authenticate data") ||
            err.message.includes("Unsupported state")
        ) {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message:
                    "Gmail is not configured correctly. Run pnpm setup:google in packages/corsair, then reconnect Gmail in settings.",
            });
        }

        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
    }

    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Something went wrong" });
}

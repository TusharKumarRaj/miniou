import { TRPCError } from "@trpc/server";

export function mapGmailError(err: unknown): never {
    if (err instanceof TRPCError) {
        throw err;
    }

    if (err instanceof Error) {
        if (err.message.includes("Connect Gmail")) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: err.message });
        }

        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
    }

    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Something went wrong" });
}

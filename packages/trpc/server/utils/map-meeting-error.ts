import { TRPCError } from "@trpc/server";

import { MeetingScopeError } from "@repo/services/meeting/guardrails";
import { MeetingRateLimitError } from "@repo/services/meeting/rate-limit";

export function mapMeetingError(err: unknown): never {
    if (err instanceof TRPCError) {
        throw err;
    }

    if (err instanceof MeetingScopeError) {
        throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
    }

    if (err instanceof MeetingRateLimitError) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: err.message });
    }

    if (err instanceof Error) {
        if (err.message.includes("Connect Gmail")) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: err.message });
        }

        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
    }

    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Something went wrong" });
}

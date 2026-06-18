import { z } from "zod";

import { dynamicObject } from "@repo/services/shared/dynamic-schema";

export const getHealthInputModel = z.undefined();

export const getHealthOutputModel = dynamicObject({
    status: () => z.literal("healthy").describe("status of the server"),
});

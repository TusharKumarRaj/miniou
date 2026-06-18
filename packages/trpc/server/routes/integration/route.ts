import { authenticatedProcedure, router } from "../../trpc";
import {
    getIntegrationStatusInputModel,
    getIntegrationStatusOutputModel,
    getConnectUrlInputModel,
    getConnectUrlOutputModel,
} from "./model";

import { integrationService } from "../../services";

import { generatePath } from "../../utils/path-generator";

const getPath = generatePath("/integrations");
const TAGS = ["Integrations"];

export const integrationRouter = router({
    getStatus: authenticatedProcedure
        .meta({
            openapi: {
                method: "GET",
                path: getPath("/getStatus"),
                tags: TAGS,
            },
        })
        .input(getIntegrationStatusInputModel)
        .output(getIntegrationStatusOutputModel)
        .query(async ({ ctx }) => {
            return integrationService.getConnectionStatus(ctx.user.id);
        }),

    getConnectUrl: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/getConnectUrl"),
                tags: TAGS,
            },
        })
        .input(getConnectUrlInputModel)
        .output(getConnectUrlOutputModel)
        .mutation(async ({ ctx, input }) => {
            return integrationService.getConnectUrl(ctx.user.id, input);
        }),
});

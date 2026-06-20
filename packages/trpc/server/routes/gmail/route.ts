import { authenticatedProcedure, router } from "../../trpc";
import {
    getMessageInputModel,
    getMessageOutputModel,
    getThreadInputModel,
    getThreadOutputModel,
    listInboxInputModel,
    listInboxOutputModel,
    sendEmailInputModel,
    sendEmailOutputModel,
} from "./model";

import { gmailService } from "../../services";

import { mapGmailError } from "../../utils/map-gmail-error";
import { generatePath } from "../../utils/path-generator";

const getPath = generatePath("/gmail");
const TAGS = ["Gmail"];

export const gmailRouter = router({
    listInbox: authenticatedProcedure
        .meta({
            openapi: {
                method: "GET",
                path: getPath("/listInbox"),
                tags: TAGS,
            },
        })
        .input(listInboxInputModel)
        .output(listInboxOutputModel)
        .query(async ({ ctx, input }) => {
            try {
                return await gmailService.listInbox(ctx.user.id, input);
            } catch (err) {
                mapGmailError(err);
            }
        }),

    getMessage: authenticatedProcedure
        .meta({
            openapi: {
                method: "GET",
                path: getPath("/getMessage"),
                tags: TAGS,
            },
        })
        .input(getMessageInputModel)
        .output(getMessageOutputModel)
        .query(async ({ ctx, input }) => {
            try {
                return await gmailService.getMessage(ctx.user.id, input);
            } catch (err) {
                mapGmailError(err);
            }
        }),

    getThread: authenticatedProcedure
        .meta({
            openapi: {
                method: "GET",
                path: getPath("/getThread"),
                tags: TAGS,
            },
        })
        .input(getThreadInputModel)
        .output(getThreadOutputModel)
        .query(async ({ ctx, input }) => {
            try {
                return await gmailService.getThread(ctx.user.id, input);
            } catch (err) {
                mapGmailError(err);
            }
        }),

    sendEmail: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/sendEmail"),
                tags: TAGS,
            },
        })
        .input(sendEmailInputModel)
        .output(sendEmailOutputModel)
        .mutation(async ({ ctx, input }) => {
            try {
                return await gmailService.sendEmail(ctx.user.id, input);
            } catch (err) {
                mapGmailError(err);
            }
        }),
});

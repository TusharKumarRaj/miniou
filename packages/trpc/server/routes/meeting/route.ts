import { authenticatedProcedure, router } from "../../trpc";
import {
    createSessionInputModel,
    createSessionOutputModel,
    getHistoryInputModel,
    getHistoryOutputModel,
    listSessionsInputModel,
    listSessionsOutputModel,
    sendMessageInputModel,
    sendMessageOutputModel,
} from "./model";

import { meetingService } from "../../services";

import { mapMeetingError } from "../../utils/map-meeting-error";
import { generatePath } from "../../utils/path-generator";

const getPath = generatePath("/meetings");
const TAGS = ["Meetings"];

export const meetingRouter = router({
    listSessions: authenticatedProcedure
        .meta({
            openapi: {
                method: "GET",
                path: getPath("/listSessions"),
                tags: TAGS,
            },
        })
        .input(listSessionsInputModel)
        .output(listSessionsOutputModel)
        .query(async ({ ctx, input }) => {
            try {
                return await meetingService.listSessions(ctx.user.id, input);
            } catch (err) {
                mapMeetingError(err);
            }
        }),

    createSession: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/createSession"),
                tags: TAGS,
            },
        })
        .input(createSessionInputModel)
        .output(createSessionOutputModel)
        .mutation(async ({ ctx, input }) => {
            try {
                return await meetingService.createSession(ctx.user.id, input);
            } catch (err) {
                mapMeetingError(err);
            }
        }),

    sendMessage: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/sendMessage"),
                tags: TAGS,
            },
        })
        .input(sendMessageInputModel)
        .output(sendMessageOutputModel)
        .mutation(async ({ ctx, input }) => {
            try {
                return await meetingService.sendMessage(ctx.user.id, input);
            } catch (err) {
                mapMeetingError(err);
            }
        }),

    getHistory: authenticatedProcedure
        .meta({
            openapi: {
                method: "GET",
                path: getPath("/getHistory"),
                tags: TAGS,
            },
        })
        .input(getHistoryInputModel)
        .output(getHistoryOutputModel)
        .query(async ({ ctx, input }) => {
            try {
                return await meetingService.getHistory(ctx.user.id, input);
            } catch (err) {
                mapMeetingError(err);
            }
        }),
});

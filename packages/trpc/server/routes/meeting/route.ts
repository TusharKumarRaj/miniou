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
    prepareEmailDraftInputModel,
    prepareEmailDraftOutputModel,
    prepareCalendarDraftInputModel,
    prepareCalendarDraftOutputModel,
    confirmEmailSendInputModel,
    confirmEmailSendOutputModel,
    cancelEmailPreviewInputModel,
    cancelEmailPreviewOutputModel,
    confirmCalendarEventInputModel,
    confirmCalendarEventOutputModel,
    cancelCalendarPreviewInputModel,
    cancelCalendarPreviewOutputModel,
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

    prepareEmailDraft: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/prepareEmailDraft"),
                tags: TAGS,
            },
        })
        .input(prepareEmailDraftInputModel)
        .output(prepareEmailDraftOutputModel)
        .mutation(async ({ ctx, input }) => {
            try {
                return await meetingService.prepareEmailDraft(ctx.user.id, input);
            } catch (err) {
                mapMeetingError(err);
            }
        }),

    prepareCalendarDraft: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/prepareCalendarDraft"),
                tags: TAGS,
            },
        })
        .input(prepareCalendarDraftInputModel)
        .output(prepareCalendarDraftOutputModel)
        .mutation(async ({ ctx, input }) => {
            try {
                return await meetingService.prepareCalendarDraft(ctx.user.id, input);
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

    confirmEmailSend: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/confirmEmailSend"),
                tags: TAGS,
            },
        })
        .input(confirmEmailSendInputModel)
        .output(confirmEmailSendOutputModel)
        .mutation(async ({ ctx, input }) => {
            try {
                return await meetingService.confirmEmailSend(ctx.user.id, input);
            } catch (err) {
                mapMeetingError(err);
            }
        }),

    cancelEmailPreview: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/cancelEmailPreview"),
                tags: TAGS,
            },
        })
        .input(cancelEmailPreviewInputModel)
        .output(cancelEmailPreviewOutputModel)
        .mutation(async ({ ctx, input }) => {
            try {
                return await meetingService.cancelEmailPreview(ctx.user.id, input);
            } catch (err) {
                mapMeetingError(err);
            }
        }),

    confirmCalendarEvent: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/confirmCalendarEvent"),
                tags: TAGS,
            },
        })
        .input(confirmCalendarEventInputModel)
        .output(confirmCalendarEventOutputModel)
        .mutation(async ({ ctx, input }) => {
            try {
                return await meetingService.confirmCalendarEvent(ctx.user.id, input);
            } catch (err) {
                mapMeetingError(err);
            }
        }),

    cancelCalendarPreview: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/cancelCalendarPreview"),
                tags: TAGS,
            },
        })
        .input(cancelCalendarPreviewInputModel)
        .output(cancelCalendarPreviewOutputModel)
        .mutation(async ({ ctx, input }) => {
            try {
                return await meetingService.cancelCalendarPreview(ctx.user.id, input);
            } catch (err) {
                mapMeetingError(err);
            }
        }),
});

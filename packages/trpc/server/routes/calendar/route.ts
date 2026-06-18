import { authenticatedProcedure, router } from "../../trpc";
import {
    createEventInputModel,
    createEventOutputModel,
    deleteEventInputModel,
    deleteEventOutputModel,
    getEventInputModel,
    getEventOutputModel,
    listEventsInputModel,
    listEventsOutputModel,
} from "./model";

import { calendarService } from "../../services";

import { mapCalendarError } from "../../utils/map-calendar-error";
import { generatePath } from "../../utils/path-generator";

const getPath = generatePath("/calendar");
const TAGS = ["Calendar"];

export const calendarRouter = router({
    listEvents: authenticatedProcedure
        .meta({
            openapi: {
                method: "GET",
                path: getPath("/listEvents"),
                tags: TAGS,
            },
        })
        .input(listEventsInputModel)
        .output(listEventsOutputModel)
        .query(async ({ ctx, input }) => {
            try {
                return await calendarService.listEvents(ctx.user.id, input);
            } catch (err) {
                mapCalendarError(err);
            }
        }),

    getEvent: authenticatedProcedure
        .meta({
            openapi: {
                method: "GET",
                path: getPath("/getEvent"),
                tags: TAGS,
            },
        })
        .input(getEventInputModel)
        .output(getEventOutputModel)
        .query(async ({ ctx, input }) => {
            try {
                return await calendarService.getEvent(ctx.user.id, input);
            } catch (err) {
                mapCalendarError(err);
            }
        }),

    createEvent: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/createEvent"),
                tags: TAGS,
            },
        })
        .input(createEventInputModel)
        .output(createEventOutputModel)
        .mutation(async ({ ctx, input }) => {
            try {
                return await calendarService.createEvent(ctx.user.id, input);
            } catch (err) {
                mapCalendarError(err);
            }
        }),

    deleteEvent: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/deleteEvent"),
                tags: TAGS,
            },
        })
        .input(deleteEventInputModel)
        .output(deleteEventOutputModel)
        .mutation(async ({ ctx, input }) => {
            try {
                return await calendarService.deleteEvent(ctx.user.id, input);
            } catch (err) {
                mapCalendarError(err);
            }
        }),
});

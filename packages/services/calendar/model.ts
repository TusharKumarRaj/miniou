import { z } from "zod";

import { dynamicArray, dynamicObject } from "../shared/dynamic-schema";

export const calendarEventSummaryModel = dynamicObject({
    id: () => z.string(),
    title: () => z.string(),
    description: () => z.string(),
    location: () => z.string(),
    when: () => z.string(),
    start: () => z.string(),
    end: () => z.string(),
    htmlLink: () => z.string(),
    hangoutLink: () => z.string(),
    status: () => z.string(),
    attendeeCount: () => z.number(),
});

export const listEventsInputModel = dynamicObject({
    maxResults: () => z.coerce.number().int().min(1).max(100).default(50),
    pageToken: () => z.string().optional(),
    daysAhead: () => z.coerce.number().int().min(1).max(90).optional(),
    timeMin: () => z.string().optional(),
    timeMax: () => z.string().optional(),
});

export type ListEventsInputModel = z.infer<typeof listEventsInputModel>;

export const listEventsOutputModel = dynamicObject({
    events: () => dynamicArray(calendarEventSummaryModel),
    nextPageToken: () => z.string().optional(),
});

export const getEventInputModel = dynamicObject({
    eventId: () => z.string().min(1),
});

export type GetEventInputModel = z.infer<typeof getEventInputModel>;

export const calendarAttendeeModel = dynamicObject({
    email: () => z.string(),
    displayName: () => z.string(),
    responseStatus: () => z.string(),
});

export const getEventOutputModel = dynamicObject({
    id: () => z.string(),
    title: () => z.string(),
    description: () => z.string(),
    location: () => z.string(),
    when: () => z.string(),
    start: () => z.string(),
    end: () => z.string(),
    htmlLink: () => z.string(),
    hangoutLink: () => z.string(),
    status: () => z.string(),
    attendeeCount: () => z.number(),
    attendees: () => dynamicArray(calendarAttendeeModel),
});

export const createEventInputModel = dynamicObject({
    title: () => z.string().min(1),
    description: () => z.string().optional(),
    location: () => z.string().optional(),
    start: () => z.string().min(1),
    end: () => z.string().min(1),
    timeZone: () => z.string().optional(),
    attendeeEmails: () => z.array(z.string().email()).optional(),
});

export type CreateEventInputModel = z.infer<typeof createEventInputModel>;

export const createEventOutputModel = getEventOutputModel;

export const deleteEventInputModel = dynamicObject({
    eventId: () => z.string().min(1),
});

export type DeleteEventInputModel = z.infer<typeof deleteEventInputModel>;

export const deleteEventOutputModel = dynamicObject({
    success: () => z.literal(true),
});

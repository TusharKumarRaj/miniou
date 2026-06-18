import { withUserTenant } from "@repo/corsair";

import IntegrationService from "../integration";

import {
    createCalendarEvent,
    deleteCalendarEvent,
    fetchCalendarEvent,
    fetchUpcomingEvents,
} from "./client";
import {
    createEventInputModel,
    type CreateEventInputModel,
    deleteEventInputModel,
    type DeleteEventInputModel,
    getEventInputModel,
    type GetEventInputModel,
    listEventsInputModel,
    type ListEventsInputModel,
} from "./model";

export default class CalendarService {
    private integrationService = new IntegrationService();

    private async requireCalendar(userId: string) {
        const status = await this.integrationService.getConnectionStatus(userId);
        if (!status.googlecalendar) {
            throw new Error("Connect Google Calendar in settings to use your calendar.");
        }
    }

    public async listEvents(userId: string, payload: ListEventsInputModel) {
        const input = await listEventsInputModel.parseAsync(payload);
        await this.requireCalendar(userId);

        const tenant = withUserTenant(userId);
        return fetchUpcomingEvents(tenant, input);
    }

    public async getEvent(userId: string, payload: GetEventInputModel) {
        const { eventId } = await getEventInputModel.parseAsync(payload);
        await this.requireCalendar(userId);

        const tenant = withUserTenant(userId);
        return fetchCalendarEvent(tenant, eventId);
    }

    public async createEvent(userId: string, payload: CreateEventInputModel) {
        const input = await createEventInputModel.parseAsync(payload);
        await this.requireCalendar(userId);

        const tenant = withUserTenant(userId);
        return createCalendarEvent(tenant, input);
    }

    public async deleteEvent(userId: string, payload: DeleteEventInputModel) {
        const { eventId } = await deleteEventInputModel.parseAsync(payload);
        await this.requireCalendar(userId);

        const tenant = withUserTenant(userId);
        await deleteCalendarEvent(tenant, eventId);
        return { success: true as const };
    }
}

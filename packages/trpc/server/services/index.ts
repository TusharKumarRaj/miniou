import UserService from "@repo/services/user";
import IntegrationService from "@repo/services/integration";
import MeetingService from "@repo/services/meeting";
import GmailService from "@repo/services/gmail";
import CalendarService from "@repo/services/calendar";

export const userService = new UserService();
export const integrationService = new IntegrationService();
export const meetingService = new MeetingService();
export const gmailService = new GmailService();
export const calendarService = new CalendarService();

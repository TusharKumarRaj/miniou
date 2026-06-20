import { createSelectSchema } from "drizzle-zod";

import { chatMessagesTable } from "../models/chat-message";
import { chatSessionsTable } from "../models/chat-session";
import { usersTable } from "../models/user";

export const chatSessionSelectSchema = createSelectSchema(chatSessionsTable);

export const chatSessionPublicSchema = chatSessionSelectSchema.omit({
    userId: true,
    pendingEmail: true,
    pendingCalendar: true,
});

export const chatMessageSelectSchema = createSelectSchema(chatMessagesTable);

export const chatMessagePublicSchema = chatMessageSelectSchema.omit({
    userId: true,
});

export const userPublicSelectSchema = createSelectSchema(usersTable).pick({
    id: true,
    fullName: true,
    email: true,
});

export const userIdSelectSchema = createSelectSchema(usersTable).pick({
    id: true,
});

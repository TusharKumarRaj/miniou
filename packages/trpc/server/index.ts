import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { integrationRouter } from "./routes/integration/route";
import { meetingRouter } from "./routes/meeting/route";
import { gmailRouter } from "./routes/gmail/route";
import { calendarRouter } from "./routes/calendar/route";

export const serverRouter = router({
    health: healthRouter,
    auth: authRouter,
    integration: integrationRouter,
    meeting: meetingRouter,
    gmail: gmailRouter,
    calendar: calendarRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;

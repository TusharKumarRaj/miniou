import "dotenv/config";

import { createCorsair } from "corsair";
import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";

import { pool } from "@repo/database";

import { env } from "./env";

export const corsair = createCorsair({
    multiTenancy: true,
    plugins: [
        gmail({ permissions: { mode: "open" } }),
        googlecalendar({ permissions: { mode: "cautious" } }),
    ],
    database: pool,
    kek: env.CORSAIR_KEK,
});

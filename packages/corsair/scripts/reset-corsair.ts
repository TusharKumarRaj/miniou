import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { pool } from "@repo/database";

import { corsair } from "../src/corsair";

const packageDir = join(dirname(fileURLToPath(import.meta.url)), "..");

async function wipeCorsairTables() {
    await pool.query("DELETE FROM corsair_events");
    await pool.query("DELETE FROM corsair_entities");
    await pool.query("DELETE FROM corsair_accounts");
    await pool.query("DELETE FROM corsair_integrations");
}

async function main() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const pubsubTopic = process.env.GMAIL_PUBSUB_TOPIC;

    if (!clientId || !clientSecret) {
        throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env");
    }

    console.log("Wiping Corsair tables...");
    await wipeCorsairTables();

    console.log("Initializing Corsair integrations...");
    execSync("corsair setup", { stdio: "inherit", cwd: packageDir, env: process.env });

    await corsair.keys.gmail.set_client_id(clientId);
    await corsair.keys.gmail.set_client_secret(clientSecret);
    await corsair.keys.googlecalendar.set_client_id(clientId);
    await corsair.keys.googlecalendar.set_client_secret(clientSecret);

    if (pubsubTopic) {
        await corsair.keys.gmail.set_topic_id(pubsubTopic);
        console.log(`Stored Gmail Pub/Sub topic: ${pubsubTopic}`);
    }

    console.log("Corsair reset complete. Restart pnpm dev, then reconnect Gmail in the app.");
    await pool.end();
}

main().catch(async (err) => {
    console.error(err);
    await pool.end().catch(() => undefined);
    process.exit(1);
});

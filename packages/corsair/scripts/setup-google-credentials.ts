import "dotenv/config";

import { corsair } from "../src/corsair";

async function main() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const pubsubTopic = process.env.GMAIL_PUBSUB_TOPIC;

    if (!clientId || !clientSecret) {
        throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env");
    }

    await corsair.keys.gmail.set_client_id(clientId);
    await corsair.keys.gmail.set_client_secret(clientSecret);
    await corsair.keys.googlecalendar.set_client_id(clientId);
    await corsair.keys.googlecalendar.set_client_secret(clientSecret);

    if (pubsubTopic) {
        await corsair.keys.gmail.set_topic_id(pubsubTopic);
        console.log(`Stored Gmail Pub/Sub topic: ${pubsubTopic}`);
    }

    console.log("Stored Google OAuth credentials for gmail and googlecalendar.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

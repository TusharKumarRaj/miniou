CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text DEFAULT 'New chat' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "session_id" uuid;
--> statement-breakpoint
INSERT INTO "chat_sessions" ("user_id", "title", "created_at", "updated_at")
SELECT DISTINCT "user_id", 'General', MIN("created_at"), MAX("created_at")
FROM "chat_messages"
GROUP BY "user_id";
--> statement-breakpoint
UPDATE "chat_messages" m
SET "session_id" = s."id"
FROM "chat_sessions" s
WHERE m."user_id" = s."user_id" AND s."title" = 'General';
--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "session_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;

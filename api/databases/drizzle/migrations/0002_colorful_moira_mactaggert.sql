CREATE TABLE "base"."user_event_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "base"."user_event_favorites" ADD CONSTRAINT "user_event_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "base"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base"."user_event_favorites" ADD CONSTRAINT "user_event_favorites_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "base"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_event_favorites_unique" ON "base"."user_event_favorites" USING btree ("user_id","event_id");--> statement-breakpoint
CREATE INDEX "idx_user_event_favorites_user_id" ON "base"."user_event_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_event_favorites_event_id" ON "base"."user_event_favorites" USING btree ("event_id");
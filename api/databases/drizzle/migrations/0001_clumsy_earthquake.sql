CREATE TYPE "base"."event_type" AS ENUM('concert', 'exhibition', 'conference', 'sport', 'festival', 'other');--> statement-breakpoint
CREATE TABLE "base"."events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"country" text NOT NULL,
	"type" "base"."event_type" NOT NULL,
	"price_amount" numeric(10, 2) NOT NULL,
	"price_currency" text DEFAULT 'EUR' NOT NULL,
	"is_free" boolean NOT NULL,
	"description" text,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_events_date" ON "base"."events" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_events_type" ON "base"."events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_events_name" ON "base"."events" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_events_city_country" ON "base"."events" USING btree ("city","country");
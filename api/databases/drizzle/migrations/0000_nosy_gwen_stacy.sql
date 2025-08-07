CREATE SCHEMA IF NOT EXISTS "base";--> statement-breakpoint
CREATE TYPE "base"."credential_type" AS ENUM('token');--> statement-breakpoint
CREATE TYPE "base"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "base"."credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"password" text NOT NULL,
	"type" "base"."credential_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "base"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" "base"."user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "base"."credentials" ADD CONSTRAINT "credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "base"."users"("id") ON DELETE cascade ON UPDATE no action;
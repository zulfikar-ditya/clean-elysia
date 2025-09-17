CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'suspended', 'blocked');--> statement-breakpoint
DROP INDEX "users_email_index";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" "user_status" DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "remark" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX "users_email_deleted_at_status_index" ON "users" USING btree ("email","deleted_at","status");
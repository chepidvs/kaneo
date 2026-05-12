CREATE TABLE "task_assignee" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task_assignee" ADD CONSTRAINT "task_assignee_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "task_assignee" ADD CONSTRAINT "task_assignee_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "task_assignee_taskId_idx" ON "task_assignee" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_assignee_userId_idx" ON "task_assignee" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_assignee_task_user_unique" ON "task_assignee" USING btree ("task_id","user_id");--> statement-breakpoint
INSERT INTO "task_assignee" ("id", "task_id", "user_id", "created_at")
SELECT gen_random_uuid(), "id", "assignee_id", COALESCE("created_at", now())
FROM "task"
WHERE "assignee_id" IS NOT NULL
ON CONFLICT DO NOTHING;
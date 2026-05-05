CREATE TABLE "task_module" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"module_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task" DROP CONSTRAINT "task_module_id_module_id_fk";
--> statement-breakpoint
DROP INDEX "task_moduleId_idx";--> statement-breakpoint
ALTER TABLE "task_module" ADD CONSTRAINT "task_module_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "task_module" ADD CONSTRAINT "task_module_module_id_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."module"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "task_module_taskId_idx" ON "task_module" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_module_moduleId_idx" ON "task_module" USING btree ("module_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_module_task_module_unique" ON "task_module" USING btree ("task_id","module_id");--> statement-breakpoint
INSERT INTO "task_module" ("id", "task_id", "module_id", "created_at")
SELECT gen_random_uuid()::text, "id", "module_id", now()
FROM "task"
WHERE "module_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "task" DROP COLUMN "module_id";
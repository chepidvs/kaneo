CREATE TABLE "task_label" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"label_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "label" DROP CONSTRAINT "label_task_name_unique";--> statement-breakpoint
ALTER TABLE "label" DROP CONSTRAINT "label_task_id_task_id_fk";
--> statement-breakpoint
ALTER TABLE "label" DROP CONSTRAINT "label_workspace_id_workspace_id_fk";
--> statement-breakpoint
DROP INDEX "label_task_id_idx";--> statement-breakpoint
DROP INDEX "label_workspace_id_idx";--> statement-breakpoint
DROP INDEX "label_workspace_name_unique";--> statement-breakpoint
ALTER TABLE "label" ADD COLUMN "project_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "task_label" ADD CONSTRAINT "task_label_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "task_label" ADD CONSTRAINT "task_label_label_id_label_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."label"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "task_label_task_id_idx" ON "task_label" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_label_label_id_idx" ON "task_label" USING btree ("label_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_label_task_label_unique" ON "task_label" USING btree ("task_id","label_id");--> statement-breakpoint
ALTER TABLE "label" ADD CONSTRAINT "label_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "label_project_id_idx" ON "label" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "label_project_name_unique" ON "label" USING btree ("project_id","name");--> statement-breakpoint
ALTER TABLE "label" DROP COLUMN "task_id";--> statement-breakpoint
ALTER TABLE "label" DROP COLUMN "workspace_id";
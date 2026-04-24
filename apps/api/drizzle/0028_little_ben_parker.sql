CREATE TABLE "task_label" (
  "id" text PRIMARY KEY NOT NULL,
  "task_id" text NOT NULL,
  "label_id" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "label" DROP CONSTRAINT IF EXISTS "label_task_name_unique";
--> statement-breakpoint
ALTER TABLE "label" DROP CONSTRAINT IF EXISTS "label_task_id_task_id_fk";
--> statement-breakpoint
ALTER TABLE "label" DROP CONSTRAINT IF EXISTS "label_workspace_id_workspace_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "label_task_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "label_workspace_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "label_workspace_name_unique";
--> statement-breakpoint
ALTER TABLE "label" ADD COLUMN "project_id" text;
--> statement-breakpoint
UPDATE "label"
SET "project_id" = "task"."project_id"
FROM "task"
WHERE "label"."task_id" = "task"."id";
--> statement-breakpoint
UPDATE "label"
SET "project_id" = (
  SELECT "project"."id"
  FROM "project"
  WHERE "project"."workspace_id" = "label"."workspace_id"
  ORDER BY "project"."created_at" ASC
  LIMIT 1
)
WHERE "label"."project_id" IS NULL
  AND "label"."workspace_id" IS NOT NULL;
--> statement-breakpoint
INSERT INTO "task_label" ("id", "task_id", "label_id", "created_at")
SELECT
  'tl_' || md5("label"."task_id" || ':' || "label"."id"),
  "label"."task_id",
  "label"."id",
  now()
FROM "label"
WHERE "label"."task_id" IS NOT NULL
ON CONFLICT DO NOTHING;
--> statement-breakpoint
DELETE FROM "label"
WHERE "project_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "label" ALTER COLUMN "project_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "task_label" ADD CONSTRAINT "task_label_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "task_label" ADD CONSTRAINT "task_label_label_id_label_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."label"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
CREATE INDEX "task_label_task_id_idx" ON "task_label" USING btree ("task_id");
--> statement-breakpoint
CREATE INDEX "task_label_label_id_idx" ON "task_label" USING btree ("label_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "task_label_task_label_unique" ON "task_label" USING btree ("task_id","label_id");
--> statement-breakpoint
ALTER TABLE "label" ADD CONSTRAINT "label_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
CREATE INDEX "label_project_id_idx" ON "label" USING btree ("project_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "label_project_name_unique" ON "label" USING btree ("project_id","name");
--> statement-breakpoint
ALTER TABLE "label" DROP COLUMN "task_id";
--> statement-breakpoint
ALTER TABLE "label" DROP COLUMN "workspace_id";
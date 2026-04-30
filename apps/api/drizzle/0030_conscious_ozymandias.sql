CREATE TABLE IF NOT EXISTS "module" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "page" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN IF NOT EXISTS "module_id" text;--> statement-breakpoint
ALTER TABLE "page" ADD COLUMN IF NOT EXISTS "title" text;--> statement-breakpoint
ALTER TABLE "page" ADD COLUMN IF NOT EXISTS "slug" text;--> statement-breakpoint
ALTER TABLE "page" ADD COLUMN IF NOT EXISTS "content" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "page" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "page" ADD COLUMN IF NOT EXISTS "created_by" text;--> statement-breakpoint
DO $$ BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'page'
			AND column_name = 'name'
	) THEN
		UPDATE "page" SET "title" = COALESCE("title", "name", 'Untitled') WHERE "title" IS NULL;
	ELSE
		UPDATE "page" SET "title" = COALESCE("title", 'Untitled') WHERE "title" IS NULL;
	END IF;
END $$;--> statement-breakpoint
UPDATE "page" SET "slug" = COALESCE("slug", "id") WHERE "slug" IS NULL;--> statement-breakpoint
UPDATE "page" SET "content" = COALESCE("content", '') WHERE "content" IS NULL;--> statement-breakpoint
UPDATE "page" SET "is_public" = COALESCE("is_public", false) WHERE "is_public" IS NULL;--> statement-breakpoint
DO $$ BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'task'
			AND column_name = 'page_id'
	)
	AND EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'page'
			AND column_name = 'module_id'
	) THEN
		UPDATE "task"
		SET "module_id" = "page"."module_id"
		FROM "page"
		WHERE "task"."module_id" IS NULL
			AND "task"."page_id" = "page"."id";
	END IF;
END $$;--> statement-breakpoint
ALTER TABLE "page" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "page" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "page" ALTER COLUMN "content" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "page" ALTER COLUMN "content" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "page" ALTER COLUMN "is_public" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "page" ALTER COLUMN "is_public" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "task" DROP CONSTRAINT IF EXISTS "task_page_id_page_id_fk";--> statement-breakpoint
DROP INDEX IF EXISTS "task_pageId_idx";--> statement-breakpoint
ALTER TABLE "task" DROP COLUMN IF EXISTS "page_id";--> statement-breakpoint
ALTER TABLE "page" DROP CONSTRAINT IF EXISTS "page_module_id_module_id_fk";--> statement-breakpoint
DROP INDEX IF EXISTS "page_moduleId_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "page_module_name_unique";--> statement-breakpoint
ALTER TABLE "page" DROP COLUMN IF EXISTS "module_id";--> statement-breakpoint
ALTER TABLE "page" DROP COLUMN IF EXISTS "name";--> statement-breakpoint
ALTER TABLE "page" DROP COLUMN IF EXISTS "description";--> statement-breakpoint
ALTER TABLE "page" DROP COLUMN IF EXISTS "view_type";--> statement-breakpoint
ALTER TABLE "page" DROP COLUMN IF EXISTS "position";--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "module" ADD CONSTRAINT "module_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "page" ADD CONSTRAINT "page_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "page" ADD CONSTRAINT "page_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "module_projectId_idx" ON "module" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "module_project_name_unique" ON "module" USING btree ("project_id","name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_projectId_idx" ON "page" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_createdBy_idx" ON "page" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "page_project_slug_unique" ON "page" USING btree ("project_id","slug");--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "task" ADD CONSTRAINT "task_module_id_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."module"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_moduleId_idx" ON "task" USING btree ("module_id");

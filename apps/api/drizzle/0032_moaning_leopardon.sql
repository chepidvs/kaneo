CREATE TABLE "workspace_role_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"role" text NOT NULL,
	"permissions" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_role_permissions_workspace_role_unique" UNIQUE("workspace_id","role")
);
--> statement-breakpoint
ALTER TABLE "workspace_role_permissions" ADD CONSTRAINT "workspace_role_permissions_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_role_permissions_workspaceId_idx" ON "workspace_role_permissions" USING btree ("workspace_id");
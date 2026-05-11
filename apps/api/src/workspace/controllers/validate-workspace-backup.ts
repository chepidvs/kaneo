import { inArray } from "drizzle-orm";
import db, { schema } from "../../database";
import {
  parseWorkspaceBackup,
  validateWorkspaceBackupStructure,
} from "../backup-schema";

async function validateWorkspaceBackup(input: unknown) {
  try {
    const backup = parseWorkspaceBackup(input);
    const validation = validateWorkspaceBackupStructure(backup);

    const emails = Array.from(
      new Set(
        backup.members
          .map((member) => member.email.trim().toLowerCase())
          .filter(Boolean),
      ),
    );

    const existingUsers =
      emails.length > 0
        ? await db
            .select({
              id: schema.userTable.id,
              email: schema.userTable.email,
            })
            .from(schema.userTable)
            .where(inArray(schema.userTable.email, emails))
        : [];

    const existingEmailSet = new Set(
      existingUsers.map((user) => user.email.trim().toLowerCase()),
    );

    const unresolvedMembers = backup.members
      .filter(
        (member) => !existingEmailSet.has(member.email.trim().toLowerCase()),
      )
      .map((member) => member.email);

    const warnings = [...validation.warnings];
    if (unresolvedMembers.length > 0) {
      warnings.push(
        `${unresolvedMembers.length} workspace member(s) do not exist in this instance and will be skipped`,
      );
    }

    return {
      valid: validation.errors.length === 0,
      errors: validation.errors,
      warnings,
      summary: validation.summary,
      excluded: backup.excluded,
      sourceWorkspace: backup.meta.sourceWorkspace,
      unresolvedMembers,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : "Invalid backup file"],
      warnings: [] as string[],
      summary: null,
      excluded: [] as string[],
      sourceWorkspace: null,
      unresolvedMembers: [] as string[],
    };
  }
}

export default validateWorkspaceBackup;

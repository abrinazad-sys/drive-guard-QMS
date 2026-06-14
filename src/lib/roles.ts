// ─── Shared Drive role model (frontend mirror of backend roles.ts) ───

export const DRIVE_ROLES = ["reader", "commenter", "writer", "fileOrganizer", "organizer"] as const;
export type DriveRole = (typeof DRIVE_ROLES)[number];

export const DEFAULT_ROLE: DriveRole = "reader";

export const ROLE_UI_LABEL: Record<DriveRole, string> = {
  reader: "Viewer",
  commenter: "Commenter",
  writer: "Contributor",
  fileOrganizer: "Content Manager",
  organizer: "Manager",
};

// Short description shown under each option in dropdowns.
export const ROLE_DESCRIPTION: Record<DriveRole, string> = {
  reader: "Can view files",
  commenter: "Can view and comment",
  writer: "Can view, comment, and edit",
  fileOrganizer: "Can manage content",
  organizer: "Can manage content, people, and settings",
};

export const ROLE_OPTIONS: { value: DriveRole; label: string; description: string }[] =
  DRIVE_ROLES.map((value) => ({
    value,
    label: ROLE_UI_LABEL[value],
    description: ROLE_DESCRIPTION[value],
  }));

// Roles an admin is allowed to grant from the UI.
// "Manager" (organizer) is excluded — we can't assign it via the service account.
export const NON_GRANTABLE_ROLES: DriveRole[] = ["organizer"];

export const GRANTABLE_ROLE_OPTIONS = ROLE_OPTIONS.filter(
  (opt) => !NON_GRANTABLE_ROLES.includes(opt.value),
);

export function roleLabel(role: string | null | undefined): string {
  if (role && role in ROLE_UI_LABEL) return ROLE_UI_LABEL[role as DriveRole];
  return "Viewer";
}

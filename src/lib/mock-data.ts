export type Role = "admin" | "employee";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  syncStatus: "synced" | "pending" | "failed";
  lastLogin: string;
}

export interface Folder {
  id: string;
  name: string;
  parent: string;
  modified: string;
  itemCount: number;
}

export interface FileItem {
  id: string;
  name: string;
  type: "pdf" | "docx" | "xlsx" | "image" | "pptx" | "other";
  size: string;
  folder: string;
  modified: string;
  owner: string;
  syncStatus: "synced" | "pending" | "failed";
}

export const users: User[] = [
  { id: "u1", name: "Aisha Rahman", email: "admin@qms.com", role: "admin", active: true, syncStatus: "synced", lastLogin: "Today, 09:12" },
  { id: "u2", name: "David Miller", email: "david.miller@example.com", role: "admin", active: true, syncStatus: "synced", lastLogin: "Yesterday, 17:40" },
  { id: "u3", name: "Sarah Ahmed", email: "employee@qms.com", role: "employee", active: true, syncStatus: "synced", lastLogin: "Today, 08:22" },
  { id: "u4", name: "Karim Hasan", email: "karim.hasan@example.com", role: "employee", active: true, syncStatus: "pending", lastLogin: "2 days ago" },
  { id: "u5", name: "Nusrat Jahan", email: "nusrat.jahan@example.com", role: "employee", active: true, syncStatus: "synced", lastLogin: "Today, 10:01" },
  { id: "u6", name: "James Wilson", email: "james.wilson@example.com", role: "employee", active: false, syncStatus: "failed", lastLogin: "1 week ago" },
  { id: "u7", name: "Maria Chen", email: "maria.chen@example.com", role: "employee", active: true, syncStatus: "synced", lastLogin: "Today, 07:55" },
];

export const folders: Folder[] = [
  { id: "f1", name: "HR Policies", parent: "Company > HR", modified: "2 days ago", itemCount: 14 },
  { id: "f2", name: "Quality Manuals", parent: "Company > QA", modified: "Today", itemCount: 22 },
  { id: "f3", name: "Training Documents", parent: "Company > HR", modified: "1 week ago", itemCount: 31 },
  { id: "f4", name: "Health & Safety", parent: "Company > Ops", modified: "3 days ago", itemCount: 18 },
  { id: "f5", name: "Client Templates", parent: "Company > Sales", modified: "Today", itemCount: 9 },
  { id: "f6", name: "Internal Procedures", parent: "Company > Ops", modified: "5 days ago", itemCount: 27 },
  { id: "f7", name: "Finance Documents", parent: "Company > Finance", modified: "Yesterday", itemCount: 41 },
  { id: "f8", name: "Legal Documents", parent: "Company > Legal", modified: "1 week ago", itemCount: 12 },
  { id: "f9", name: "Audit Evidence", parent: "Company > QA", modified: "Today", itemCount: 16 },
  { id: "f10", name: "ISO Compliance Records", parent: "Company > QA", modified: "Today", itemCount: 24 },
];

export const files: FileItem[] = [
  { id: "fi1", name: "Employee Handbook.pdf", type: "pdf", size: "2.4 MB", folder: "HR Policies", modified: "2 days ago", owner: "Aisha Rahman", syncStatus: "synced" },
  { id: "fi2", name: "Quality Manual v3.docx", type: "docx", size: "1.2 MB", folder: "Quality Manuals", modified: "Today", owner: "David Miller", syncStatus: "synced" },
  { id: "fi3", name: "Training Matrix.xlsx", type: "xlsx", size: "740 KB", folder: "Training Documents", modified: "1 week ago", owner: "Aisha Rahman", syncStatus: "synced" },
  { id: "fi4", name: "Health and Safety Policy.pdf", type: "pdf", size: "3.1 MB", folder: "Health & Safety", modified: "3 days ago", owner: "David Miller", syncStatus: "synced" },
  { id: "fi5", name: "Client Onboarding Template.docx", type: "docx", size: "560 KB", folder: "Client Templates", modified: "Today", owner: "Maria Chen", syncStatus: "pending" },
  { id: "fi6", name: "Internal Audit Checklist.xlsx", type: "xlsx", size: "320 KB", folder: "Internal Procedures", modified: "5 days ago", owner: "Aisha Rahman", syncStatus: "synced" },
  { id: "fi7", name: "ISO 9001 Evidence Pack.pdf", type: "pdf", size: "5.6 MB", folder: "ISO Compliance Records", modified: "Today", owner: "David Miller", syncStatus: "synced" },
  { id: "fi8", name: "Data Protection Policy.pdf", type: "pdf", size: "1.8 MB", folder: "Legal Documents", modified: "1 week ago", owner: "David Miller", syncStatus: "synced" },
  { id: "fi9", name: "Supplier Evaluation Form.xlsx", type: "xlsx", size: "210 KB", folder: "Audit Evidence", modified: "Yesterday", owner: "Aisha Rahman", syncStatus: "synced" },
  { id: "fi10", name: "Corrective Action Procedure.docx", type: "docx", size: "480 KB", folder: "Internal Procedures", modified: "3 days ago", owner: "David Miller", syncStatus: "failed" },
];

export const auditLogs = [
  { id: "a1", time: "Today, 10:42", actor: "Aisha Rahman", role: "admin", action: "Granted access", target: "Sarah Ahmed", folder: "HR Policies", status: "success", ip: "192.168.1.5" },
  { id: "a2", time: "Today, 10:21", actor: "David Miller", role: "admin", action: "Revoked access", target: "Karim Hasan", folder: "Finance Documents", status: "success", ip: "192.168.1.6" },
  { id: "a3", time: "Today, 09:50", actor: "Sarah Ahmed", role: "employee", action: "File downloaded", target: "Employee Handbook.pdf", folder: "HR Policies", status: "success", ip: "10.0.0.21" },
  { id: "a4", time: "Today, 09:30", actor: "Nusrat Jahan", role: "employee", action: "File previewed", target: "Quality Manual v3.docx", folder: "Quality Manuals", status: "success", ip: "10.0.0.22" },
  { id: "a5", time: "Today, 09:10", actor: "System", role: "admin", action: "Sync failed", target: "Legal Documents", folder: "Legal Documents", status: "failed", ip: "—", error: "Drive API permission denied" },
  { id: "a6", time: "Yesterday, 18:00", actor: "Aisha Rahman", role: "admin", action: "User created", target: "Maria Chen", folder: "—", status: "success", ip: "192.168.1.5" },
  { id: "a7", time: "Yesterday, 17:30", actor: "James Wilson", role: "employee", action: "Login failed", target: "—", folder: "—", status: "failed", ip: "10.0.0.30" },
  { id: "a8", time: "Yesterday, 16:00", actor: "David Miller", role: "admin", action: "Password reset triggered", target: "Karim Hasan", folder: "—", status: "success", ip: "192.168.1.6" },
];

export const syncRecords = [
  { id: "s1", item: "Legal Documents", type: "Folder", user: "—", folder: "Legal Documents", status: "failed", error: "Drive API permission denied", lastAttempt: "Today, 09:10" },
  { id: "s2", item: "Karim Hasan", type: "User", user: "Karim Hasan", folder: "—", status: "pending", error: "—", lastAttempt: "Today, 08:00" },
  { id: "s3", item: "Corrective Action Procedure.docx", type: "File", user: "—", folder: "Internal Procedures", status: "failed", error: "Folder not found", lastAttempt: "Today, 07:30" },
  { id: "s4", item: "James Wilson", type: "User", user: "James Wilson", folder: "—", status: "failed", error: "User email not found in workspace", lastAttempt: "Yesterday" },
  { id: "s5", item: "Audit Evidence", type: "Folder", user: "—", folder: "Audit Evidence", status: "synced", error: "—", lastAttempt: "Today, 10:30" },
];

export const notifications = {
  admin: [
    { id: "n1", title: "3 sync failures need attention", time: "5m ago", read: false },
    { id: "n2", title: "Google Drive sync completed successfully", time: "1h ago", read: false },
    { id: "n3", title: "Access granted to 4 users", time: "3h ago", read: true },
    { id: "n4", title: "New user created: Maria Chen", time: "Yesterday", read: true },
  ],
  employee: [
    { id: "n1", title: "You have been granted access to HR Policies", time: "10m ago", read: false },
    { id: "n2", title: "Your access to Finance Documents was removed", time: "2h ago", read: false },
    { id: "n3", title: "Password changed successfully", time: "Yesterday", read: true },
    { id: "n4", title: "New document available in Training Documents", time: "2 days ago", read: true },
  ],
};

export const groups = [
  { id: "g1", name: "HR Team", members: 6, folders: ["HR Policies", "Training Documents"] },
  { id: "g2", name: "Finance Team", members: 4, folders: ["Finance Documents"] },
  { id: "g3", name: "Management", members: 5, folders: ["Quality Manuals", "Internal Procedures"] },
  { id: "g4", name: "QA Team", members: 7, folders: ["Quality Manuals", "Audit Evidence", "ISO Compliance Records"] },
  { id: "g5", name: "External Auditors", members: 2, folders: ["Audit Evidence"] },
];

// Permission map: userId -> folderId[]
export const initialPermissions: Record<string, string[]> = {
  u3: ["f1", "f2", "f3"],
  u4: ["f1", "f5"],
  u5: ["f2", "f9", "f10"],
  u6: [],
  u7: ["f1", "f2", "f3", "f5"],
};

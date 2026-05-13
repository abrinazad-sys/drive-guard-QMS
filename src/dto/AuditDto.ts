import { z } from "zod";

export const auditLogSchema = z.object({
  id: z.number(),
  adminName: z.string(),
  action: z.string(),
  targetType: z.string(),
  targetName: z.string(),
  folderName: z.string().nullable(),
  ipAddress: z.string(),
  userOS: z.string(),
  userBrowser: z.string(),
  createdAt: z.string(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

export interface AuditLogsResponse {
  success: boolean;
  data: {
    logs: AuditLog[];
    nextCursor: number | null;
  };
}

export interface AuditLogsParams {
  cursor?: number;
  limit?: number;
  targetType?: string;
  search?: string;
}

import createAxiosInstance from "@/config/axios-config";
import { useQuery } from "@tanstack/react-query";
import type { AuditLogsResponse, AuditLogsParams, AuditLog } from "@/dto/AuditDto";

const axios = createAxiosInstance(import.meta.env.VITE_BASE_URL ?? "");

export type { AuditLog };

export function useAuditLogs(params: AuditLogsParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.cursor) queryParams.append("cursor", params.cursor.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.targetType && params.targetType !== "all") queryParams.append("targetType", params.targetType);
  if (params.search) queryParams.append("search", params.search);

  return useQuery({
    queryKey: ["audit-logs", JSON.stringify(params)],
    queryFn: async () => {
      const { data } = await axios.get<AuditLogsResponse>(`/admin/system/audit-logs?${queryParams.toString()}`);
      if (!data.success) {
        throw new Error("Failed to fetch audit logs");
      }
      return data.data;
    },
  });
}

// Legacy support if needed, but we should migrate to hooks
export const auditService = {
  getLogs: async () => {
    const { data } = await axios.get<AuditLogsResponse>("/admin/system/audit-logs");
    return data.data.logs;
  },
  addLog: (logData: any) => {
    console.log("Legacy addLog called (no-op with real API):", logData);
  }
};

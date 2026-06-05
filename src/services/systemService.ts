import createAxiosInstance from "@/config/axios-config";
import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

const axios = createAxiosInstance(import.meta.env.VITE_BASE_URL ?? "");

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  folders: {
    root: number;
  };
  permissions: {
    total: number;
  };
}

interface StatsResponse {
  success: boolean;
  data: {
    stats: DashboardStats;
  };
}

interface ApiErrorResponse {
  message?: string;
}

export function useDashboardStats() {
  return useQuery<DashboardStats, AxiosError<ApiErrorResponse>>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await axios.get<StatsResponse>("/admin/system/stats");
      if (!data.success) {
        throw new Error("Failed to fetch dashboard stats");
      }
      return data.data.stats;
    },
  });
}

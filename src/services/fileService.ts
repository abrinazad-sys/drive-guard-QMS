import createAxiosInstance from "@/config/axios-config";
import { useQuery } from "@tanstack/react-query";
import type { FoldersResponse, FolderContentsResponse, SearchResponse } from "@/dto/FolderDto";

const axios = createAxiosInstance(import.meta.env.VITE_BASE_URL ?? "");

export function logFileAccess(fileId: string, fileName: string, action: "preview" | "open_in_drive" | "download") {
  axios.post("/drive/files/access-log", { fileId, fileName, action }).catch(() => {});
}

interface AccessStats {
  totalPreviews: number;
  totalDownloads: number;
}

export function useFileAccessLogs(params: { cursor?: number; limit?: number; enabled?: boolean } = {}) {
  const queryParams = new URLSearchParams();
  if (params.cursor) queryParams.append("cursor", params.cursor.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());

  return useQuery({
    queryKey: ["file-access-logs", JSON.stringify(params)],
    queryFn: async () => {
      const { data } = await axios.get<{ success: boolean; data: { logs: any[]; nextCursor: number | null } }>(
        `/drive/files/access-logs?${queryParams.toString()}`
      );
      if (!data.success) throw new Error("Failed to fetch access logs");
      return data.data;
    },
    enabled: params.enabled ?? true,
  });
}

export function useFileAccessStats() {
  return useQuery({
    queryKey: ["file-access-stats"],
    queryFn: async () => {
      const { data } = await axios.get<{ success: boolean; data: AccessStats }>("/drive/files/access-stats");
      if (!data.success) throw new Error("Failed to fetch access stats");
      return data.data;
    },
  });
}


export function useFolders() {
  return useQuery({
    queryKey: ["drive-folders"],
    queryFn: async () => {
      const { data } = await axios.get<FoldersResponse>("/drive/folders");
      if (!data.success) {
        throw new Error("Failed to fetch folders");
      }
      return data.data.folders;
    },
  });
}


export function useFolderContents(folderId: string) {
  return useQuery({
    queryKey: ["folder-contents", folderId],
    queryFn: async () => {
      const { data } = await axios.get<FolderContentsResponse>(`/drive/folders/${folderId}`);
      if (!data.success) {
        throw new Error("Failed to fetch folder contents");
      }
      return data.data;
    },
    enabled: !!folderId,
  });
}


export function useGlobalSearch(query: string, pageSize = 10) {
  return useQuery({
    queryKey: ["global-search", query, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query, pageSize: String(pageSize) });
      const { data } = await axios.get<SearchResponse>(`/drive/search/global?${params}`);
      if (!data.success) throw new Error("Search failed");
      return data.data.items;
    },
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

export async function downloadFile(fileId: string, fileName: string) {
  try {
    const { data } = await axios.get(`/drive/files/${fileId}/download`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed:", error);
    throw error;
  }
}

import createAxiosInstance from "@/config/axios-config";
import { useQuery } from "@tanstack/react-query";
import type { FoldersResponse, FolderContentsResponse } from "@/dto/FolderDto";

const axios = createAxiosInstance(import.meta.env.VITE_BASE_URL ?? "");

export function logFileAccess(fileId: string, fileName: string, action: "preview" | "open_in_drive" | "download") {
  axios.post("/drive/files/access-log", { fileId, fileName, action }).catch(() => {});
}

interface AccessStats {
  totalPreviews: number;
  totalDownloads: number;
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

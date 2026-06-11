import createAxiosInstance from "@/config/axios-config";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { getApiErrorMessage } from "./authService";

const axios = createAxiosInstance(import.meta.env.VITE_BASE_URL ?? "");

export interface GrantPermissionRequest {
  folderId: string;
  userIds: number[];
}

interface ApiErrorResponse {
  message?: string;
}

export interface FolderPermissionDto {
  permissionId: number;
  grantedAt: string;
  grantedBy: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}

interface FolderPermissionsResponse {
  success: boolean;
  data: {
    folderId: string;
    permissions: FolderPermissionDto[];
  };
}

export function useGrantPermission() {
  return useMutation<{ success: boolean }, AxiosError<ApiErrorResponse>, GrantPermissionRequest>({
    mutationFn: async (payload) => {
      const { data } = await axios.post<{ success: boolean }>("/admin/permissions", payload);
      return data;
    },
    onError: (err) => {
      toast.error("Failed to grant permission", {
        description: getApiErrorMessage(err),
      });
    },
  });
}

export function useFolderPermissions(folderId: string | null) {
  return useQuery<FolderPermissionDto[], AxiosError<ApiErrorResponse>>({
    queryKey: ["folder-permissions", folderId],
    queryFn: async () => {
      if (!folderId) return [];
      const { data } = await axios.get<FolderPermissionsResponse>(`/admin/permissions/folder/${folderId}`);
      if (!data.success) {
        throw new Error("Failed to fetch folder permissions");
      }
      return data.data.permissions;
    },
    enabled: !!folderId,
  });
}

export interface RevokePermissionRequest {
  folderId: string;
  userId: number;
}

export function useRevokePermission() {
  return useMutation<{ success: boolean }, AxiosError<ApiErrorResponse>, RevokePermissionRequest>({
    mutationFn: async (payload) => {
      const { data } = await axios.delete<{ success: boolean }>("/admin/permissions", { data: payload });
      return data;
    },
    onError: (err) => {
      toast.error("Failed to revoke permission", {
        description: getApiErrorMessage(err),
      });
    },
  });
}

export interface GrantBulkPermissionsRequest {
  userId: number;
  folderIds: string[];
}

export function useGrantBulkPermissions() {
  return useMutation<{ success: boolean }, AxiosError<ApiErrorResponse>, GrantBulkPermissionsRequest>({
    mutationFn: async (payload) => {
      const { data } = await axios.post<{ success: boolean }>("/admin/permissions/user-folders", payload);
      return data;
    },
    onError: (err) => {
      toast.error("Failed to grant bulk permissions", {
        description: getApiErrorMessage(err),
      });
    },
  });
}

export function useRevokeBulkPermissions() {
  return useMutation<{ success: boolean }, AxiosError<ApiErrorResponse>, GrantBulkPermissionsRequest>({
    mutationFn: async (payload) => {
      const { data } = await axios.delete<{ success: boolean }>("/admin/permissions/user-folders", { data: payload });
      return data;
    },
    onError: (err) => {
      toast.error("Failed to revoke bulk permissions", {
        description: getApiErrorMessage(err),
      });
    },
  });
}

export interface UserPermissionsResponse {
  success: boolean;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
    };
    permissions: {
      permissionId: number;
      folderId: string;
      grantedAt: string;
      grantedBy: string;
      folderName: string;
    }[];
  };
}

export function useUserPermissions(userId: number | null) {
  return useQuery<UserPermissionsResponse["data"], AxiosError<ApiErrorResponse>>({
    queryKey: ["user-permissions", userId],
    queryFn: async () => {
      if (!userId) return { user: { id: 0, name: "", email: "" }, permissions: [] };
      const { data } = await axios.get<UserPermissionsResponse>(`/admin/permissions/user/${userId}`);
      if (!data.success) {
        throw new Error("Failed to fetch user permissions");
      }
      return data.data;
    },
    enabled: !!userId,
  });
}

// List users who currently have access to a folder
interface UsersWithAccessResponse {
  success: boolean;
  data: {
    users: { id: number; name: string; email: string; role: string; isActive: boolean }[];
    total: number;
  };
}

export function useUsersWithAccess(folderId: string | null, search?: string) {
  return useQuery<UsersWithAccessResponse["data"]["users"], AxiosError<ApiErrorResponse>>({
    queryKey: ["users-with-access", folderId, search],
    queryFn: async () => {
      if (!folderId) return [];
      const { data } = await axios.get<UsersWithAccessResponse>(`/admin/permissions/folders/${folderId}/users/with-access`, { params: { search } });
      if (!data.success) throw new Error("Failed to fetch users with access");
      return data.data.users;
    },
    enabled: !!folderId,
  });
}

// List users who do NOT have access to a folder (useful for granting access)
interface UsersWithoutAccessResponse {
  success: boolean;
  data: {
    users: { id: number; name: string; email: string; role: string; isActive: boolean }[];
    total: number;
  };
}

export async function startPermissionSync() {
  const { data } = await axios.post<{ success: boolean; data: { jobId: string } }>("/admin/permissions/sync");
  return data.data;
}

export interface SyncJobStatus {
  jobId: string;
  status: "waiting" | "active" | "completed" | "failed";
  result?: {
    foldersScanned: number;
    added: number;
    removed: number;
    durationMs: number;
  };
  error?: string;
  createdAt?: number;
  processedAt?: number;
}

export async function getSyncJobStatus(jobId: string) {
  const { data } = await axios.get<{ success: boolean; data: SyncJobStatus }>(`/admin/permissions/sync/${jobId}`);
  return data.data;
}

export function useUsersWithoutAccess(folderId: string | null, search?: string) {
  return useQuery<UsersWithoutAccessResponse["data"]["users"], AxiosError<ApiErrorResponse>>({
    queryKey: ["users-without-access", folderId, search],
    queryFn: async () => {
      if (!folderId) return [];
      const { data } = await axios.get<UsersWithoutAccessResponse>(`/admin/permissions/folders/${folderId}/users/without-access`, { params: { search } });
      if (!data.success) throw new Error("Failed to fetch users without access");
      return data.data.users;
    },
    enabled: !!folderId,
  });
}

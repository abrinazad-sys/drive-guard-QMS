import createAxiosInstance from "@/config/axios-config";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";

const axios = createAxiosInstance(import.meta.env.VITE_BASE_URL ?? "");

export interface UserDto {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  passwordChangeRequired: boolean;
  profilePhotoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminUsersResponse {
  success: boolean;
  data: {
    users: UserDto[];
    total: number;
  };
}

interface ApiErrorResponse {
  message?: string;
}

// const getErrorMessage = (err: AxiosError<ApiErrorResponse>) =>
//   err.response?.data?.message || err.message;

export function useAdminUsers() {
  return useQuery<UserDto[], AxiosError<ApiErrorResponse>>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await axios.get<AdminUsersResponse>("/admin/users");
      if (!data.success) {
        throw new Error("Failed to fetch users");
      }
      return data.data.users;
    },
  });
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password?: string;
  role: string;
}

export interface UpdateUserRequest {
  name: string;
  role: string;
  isActive: boolean;
}

interface UserResponse {
  success: boolean;
  data: {
    user: UserDto;
  };
}

export function useCreateUser() {
  return useMutation<UserDto, AxiosError<ApiErrorResponse>, CreateUserRequest>({
    mutationFn: async (userData) => {
      const { data } = await axios.post<UserResponse>("/admin/users", userData);
      if (!data.success) {
        throw new Error("Failed to create user");
      }
      return data.data.user;
    },
  });
}

export function useUpdateUser(id: number) {
  return useMutation<UserDto, AxiosError<ApiErrorResponse>, UpdateUserRequest>({
    mutationFn: async (userData) => {
      const { data } = await axios.patch<UserResponse>(
        `/admin/users/${id}`,
        userData,
      );
      if (!data.success) {
        throw new Error("Failed to update user");
      }
      return data.data.user;
    },
  });
}

export function useUpdateUserAdmin() {
  return useMutation<
    UserDto,
    AxiosError<ApiErrorResponse>,
    { id: number; data: UpdateUserRequest }
  >({
    mutationFn: async ({ id, data: userData }) => {
      const { data } = await axios.patch<UserResponse>(
        `/admin/users/${id}`,
        userData,
      );
      if (!data.success) {
        throw new Error("Failed to update user");
      }
      return data.data.user;
    },
  });
}

export function useDeleteUser() {
  return useMutation<void, AxiosError<ApiErrorResponse>, number>({
    mutationFn: async (id) => {
      const { data } = await axios.delete<{ success: boolean }>(`/admin/users/${id}`);
      if (!data.success) {
        throw new Error("Failed to delete user");
      }
    },
  });
}

export function useResetPasswordAdmin() {
  return useMutation<
    { success: boolean; data: { message: string } },
    AxiosError<ApiErrorResponse>,
    { id: number; temporaryPassword: string }
  >({
    mutationFn: async ({ id, temporaryPassword }) => {
      const { data } = await axios.post<{
        success: boolean;
        data: { message: string };
      }>(`/admin/users/${id}/reset-password`, { temporaryPassword });
      return data;
    },
  });
}

import createAxiosInstance from "@/config/axios-config";
import type { AxiosError } from "axios";

const axios = createAxiosInstance(import.meta.env.VITE_BASE_URL ?? "");

interface ApiErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
  };
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: {
      id: number;
      email: string;
      name: string;
      role: string;
      isActive: boolean;
      passwordChangeRequired: boolean;
      profilePhotoUrl?: string | null;
    };
  };
}

import { useMutation } from "@tanstack/react-query";

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface UpdatePasswordResponse {
  success: boolean;
  data: {
    message: string;
  };
}

export const getApiErrorMessage = (err: AxiosError<unknown>) => {
  const data = err.response?.data as { error?: { message?: string } } | undefined;
  return data?.error?.message || err.message;
}
  

export async function loginApi(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await axios.post<LoginResponse>("/auth/login", {
    email,
    password,
  });
  return data;
}

export function useUpdatePassword() {
  return useMutation<
    UpdatePasswordResponse,
    AxiosError<ApiErrorResponse>,
    UpdatePasswordRequest
  >({
    mutationFn: async (payload) => {
      const { data } = await axios.post<UpdatePasswordResponse>(
        "/auth/update-password",
        payload,
      );
      if (!data.success) {
        throw new Error("Failed to update password");
      }
      return data;
    },
  });
}

export interface ChangePasswordRequest {
  newPassword: string;
}

export function useChangePassword() {
  return useMutation<
    UpdatePasswordResponse,
    AxiosError<ApiErrorResponse>,
    ChangePasswordRequest
  >({
    mutationFn: async (payload) => {
      const { data } = await axios.post<UpdatePasswordResponse>(
        "/auth/change-password",
        payload,
      );
      if (!data.success) {
        throw new Error("Failed to change password");
      }
      return data;
    },
  });
}

export interface UpdateProfileResponse {
  success: boolean;
  data: {
    user: {
      id: number;
      email: string;
      name: string;
      role: string;
      profilePhotoUrl: string | null;
      passwordChangeRequired: boolean;
    };
  };
}

export function useUpdateProfile() {
  return useMutation<
    UpdateProfileResponse,
    AxiosError<ApiErrorResponse>,
    { name: string; photo?: File }
  >({
    mutationFn: async ({ name, photo }) => {
      const formData = new FormData();
      formData.append("name", name);
      if (photo) {
        formData.append("profilePhoto", photo);
      }
      const { data } = await axios.patch<UpdateProfileResponse>(
        "/auth/me",
        formData,
      );
      if (!data.success) {
        throw new Error("Failed to update profile");
      }
      return data;
    },
  });
}

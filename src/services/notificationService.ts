import createAxiosInstance from "@/config/axios-config";

const axios = createAxiosInstance(import.meta.env.VITE_BASE_URL ?? "");

export interface NotificationDto {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

interface NotificationPage {
  notifications: NotificationDto[];
  nextCursor: number | null;
}

export async function fetchNotifications(cursor?: number, limit = 20): Promise<NotificationPage> {
  const params: Record<string, string> = { limit: String(limit) };
  if (cursor) params.cursor = String(cursor);
  const { data } = await axios.get("/notifications", { params });
  return data.data;
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await axios.get("/notifications/unread-count");
  return data.data.count;
}

export async function markNotificationRead(id: number): Promise<void> {
  await axios.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await axios.patch("/notifications/read-all");
}

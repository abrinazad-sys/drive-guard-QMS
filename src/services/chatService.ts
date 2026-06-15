import createAxiosInstance from "@/config/axios-config";
import { useQuery } from "@tanstack/react-query";

const axios = createAxiosInstance(import.meta.env.VITE_BASE_URL ?? "");

export interface ChatAuthor {
  id: number;
  name: string;
  email: string;
  profilePhotoUrl: string | null;
}

export interface ChatMention {
  id: number;
  name: string;
  email: string;
}

export interface ChatMessage {
  id: number;
  fileId: string;
  author: ChatAuthor;
  content: string | null; // null when deleted
  mentions: ChatMention[];
  edited: boolean;
  deleted: boolean;
  createdAt: string;
}

export interface ChatPage {
  messages: ChatMessage[]; // chronological ascending
  nextCursor: number | null;
  hasMore: boolean;
}

export interface MentionableUser {
  id: number;
  name: string;
  email: string;
  profilePhotoUrl: string | null;
}

export async function fetchChatHistory(fileId: string, cursor: number | null, limit = 20): Promise<ChatPage> {
  const { data } = await axios.get<{ success: boolean; data: ChatPage }>(`/chat/files/${fileId}/messages`, {
    params: { cursor: cursor ?? undefined, limit },
  });
  return data.data;
}

export async function markChatRead(fileId: string, lastMessageId: number): Promise<void> {
  await axios.post(`/chat/files/${fileId}/read`, { lastMessageId });
}

export async function fetchUnreadCounts(fileIds: string[]): Promise<Record<string, number>> {
  if (fileIds.length === 0) return {};
  const { data } = await axios.post<{ success: boolean; data: { counts: Record<string, number> } }>(
    `/chat/unread-counts`,
    { fileIds },
  );
  return data.data.counts;
}

export async function fetchMentionableUsers(search: string): Promise<MentionableUser[]> {
  const { data } = await axios.get<{ success: boolean; data: { users: MentionableUser[] } }>(`/chat/mentionable`, {
    params: { search: search || undefined },
  });
  return data.data.users;
}

export function useUnreadCounts(fileIds: string[]) {
  return useQuery<Record<string, number>>({
    queryKey: ["chat-unread", [...fileIds].sort()],
    queryFn: () => fetchUnreadCounts(fileIds),
    enabled: fileIds.length > 0,
    staleTime: 15_000,
  });
}

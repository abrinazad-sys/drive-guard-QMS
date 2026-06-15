import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { fetchChatHistory, type ChatMessage, type ChatMention } from "@/services/chatService";

export interface LocalMessage extends ChatMessage {
  tempId?: string;
  pending?: boolean;
  failed?: boolean;
}

export interface PresenceUser {
  id: number;
  name: string;
  email: string;
  profilePhotoUrl: string | null;
}

export interface TypingUser {
  id: number;
  name: string;
  email: string;
}

interface CurrentUser {
  id: number;
  name: string;
  email: string;
  profilePhotoUrl: string | null;
}

const TYPING_TIMEOUT = 3500;

function upsertById(list: LocalMessage[], msg: LocalMessage): LocalMessage[] {
  const idx = list.findIndex((m) => m.id === msg.id);
  if (idx >= 0) {
    const copy = [...list];
    copy[idx] = { ...copy[idx], ...msg };
    return copy;
  }
  return [...list, msg].sort((a, b) => a.id - b.id);
}

export function useFileChat(fileId: string | null, open: boolean, currentUser: CurrentUser) {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [reads, setReads] = useState<Record<number, number>>({});
  const [hasMore, setHasMore] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const cursorRef = useRef<number | null>(null);
  const typingTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const lastReadSentRef = useRef<number>(0);

  // ── Initial load + socket wiring ────────────────────────────────
  useEffect(() => {
    if (!fileId || !open) return;
    const socket = getSocket();
    let cancelled = false;

    setMessages([]);
    setPresence([]);
    setTypingUsers([]);
    setReads({});
    cursorRef.current = null;
    setLoadingInitial(true);

    socket.emit("chat:join", { fileId }, (resp: { presence?: PresenceUser[] } | undefined) => {
      if (!cancelled && resp?.presence) setPresence(resp.presence);
    });

    fetchChatHistory(fileId, null)
      .then((page) => {
        if (cancelled) return;
        setMessages(page.messages as LocalMessage[]);
        setHasMore(page.hasMore);
        cursorRef.current = page.nextCursor;
      })
      .catch(() => { /* surfaced by UI empty state */ })
      .finally(() => { if (!cancelled) setLoadingInitial(false); });

    const onMessage = (msg: ChatMessage) => {
      if (msg.fileId !== fileId) return;
      setMessages((prev) => upsertById(prev.filter((m) => !(m.pending && m.author.id === msg.author.id && m.content === msg.content)), msg as LocalMessage));
    };
    const onUpdated = (msg: ChatMessage) => {
      if (msg.fileId !== fileId) return;
      setMessages((prev) => upsertById(prev, msg as LocalMessage));
    };
    const onDeleted = (msg: ChatMessage) => {
      if (msg.fileId !== fileId) return;
      setMessages((prev) => upsertById(prev, msg as LocalMessage));
    };
    const onPresence = (p: { fileId: string; users: PresenceUser[] }) => {
      if (p.fileId === fileId) setPresence(p.users);
    };
    const onTyping = (p: { fileId: string; user: TypingUser; isTyping: boolean }) => {
      if (p.fileId !== fileId || p.user.id === currentUser.id) return;
      setTypingUsers((prev) => {
        const without = prev.filter((u) => u.id !== p.user.id);
        return p.isTyping ? [...without, p.user] : without;
      });
      const timers = typingTimers.current;
      if (timers[p.user.id]) clearTimeout(timers[p.user.id]);
      if (p.isTyping) {
        timers[p.user.id] = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.id !== p.user.id));
        }, TYPING_TIMEOUT);
      }
    };
    const onRead = (p: { fileId: string; userId: number; lastMessageId: number }) => {
      if (p.fileId === fileId) setReads((prev) => ({ ...prev, [p.userId]: p.lastMessageId }));
    };

    socket.on("chat:message", onMessage);
    socket.on("chat:message:updated", onUpdated);
    socket.on("chat:message:deleted", onDeleted);
    socket.on("chat:presence", onPresence);
    socket.on("chat:typing", onTyping);
    socket.on("chat:read", onRead);

    return () => {
      cancelled = true;
      socket.emit("chat:leave", { fileId });
      socket.off("chat:message", onMessage);
      socket.off("chat:message:updated", onUpdated);
      socket.off("chat:message:deleted", onDeleted);
      socket.off("chat:presence", onPresence);
      socket.off("chat:typing", onTyping);
      socket.off("chat:read", onRead);
      Object.values(typingTimers.current).forEach(clearTimeout);
      typingTimers.current = {};
    };
  }, [fileId, open, currentUser.id]);

  // ── Actions ─────────────────────────────────────────────────────
  const loadOlder = useCallback(async () => {
    if (!fileId || !hasMore || loadingOlder || cursorRef.current == null) return;
    setLoadingOlder(true);
    try {
      const page = await fetchChatHistory(fileId, cursorRef.current);
      setMessages((prev) => {
        const existing = new Set(prev.map((m) => m.id));
        const older = (page.messages as LocalMessage[]).filter((m) => !existing.has(m.id));
        return [...older, ...prev];
      });
      setHasMore(page.hasMore);
      cursorRef.current = page.nextCursor;
    } finally {
      setLoadingOlder(false);
    }
  }, [fileId, hasMore, loadingOlder]);

  const sendMessage = useCallback((content: string, mentions: ChatMention[]) => {
    if (!fileId || !content.trim()) return;
    const tempId = (typeof crypto !== "undefined" && "randomUUID" in crypto) ? crypto.randomUUID() : String(Date.now());
    const optimistic: LocalMessage = {
      id: -Date.now(),
      tempId,
      pending: true,
      fileId,
      author: { id: currentUser.id, name: currentUser.name, email: currentUser.email, profilePhotoUrl: currentUser.profilePhotoUrl },
      content,
      mentions,
      edited: false,
      deleted: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    getSocket().emit("chat:send", { fileId, content, tempId }, (resp: { ok?: boolean; message?: ChatMessage; tempId?: string; error?: string } | undefined) => {
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.tempId !== tempId);
        if (resp?.ok && resp.message) return upsertById(withoutTemp, resp.message as LocalMessage);
        // mark failed (keep temp, flag it)
        return prev.map((m) => (m.tempId === tempId ? { ...m, pending: false, failed: true } : m));
      });
    });
  }, [fileId, currentUser]);

  const editMessage = useCallback((messageId: number, content: string) => {
    if (!fileId) return;
    getSocket().emit("chat:edit", { fileId, messageId, content });
  }, [fileId]);

  const deleteMessage = useCallback((messageId: number) => {
    if (!fileId) return;
    getSocket().emit("chat:delete", { fileId, messageId });
  }, [fileId]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (!fileId) return;
    getSocket().emit("chat:typing", { fileId, isTyping });
  }, [fileId]);

  const markRead = useCallback(() => {
    if (!fileId) return;
    const realIds = messages.filter((m) => m.id > 0).map((m) => m.id);
    if (realIds.length === 0) return;
    const latest = Math.max(...realIds);
    if (latest <= lastReadSentRef.current) return;
    lastReadSentRef.current = latest;
    getSocket().emit("chat:read", { fileId, lastMessageId: latest });
  }, [fileId, messages]);

  // Auto-mark read while the panel is open and messages change.
  useEffect(() => {
    if (open && messages.length > 0) markRead();
  }, [open, messages, markRead]);

  // Highest message id another participant has read (for "seen" receipts).
  const lastSeenByOthers = Object.entries(reads)
    .filter(([uid]) => Number(uid) !== currentUser.id)
    .reduce((max, [, mid]) => Math.max(max, mid), 0);

  return {
    messages,
    presence,
    typingUsers,
    hasMore,
    loadingInitial,
    loadingOlder,
    loadOlder,
    sendMessage,
    editMessage,
    deleteMessage,
    setTyping,
    markRead,
    lastSeenByOthers,
  };
}

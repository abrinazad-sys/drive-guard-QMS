import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationDto,
} from "@/services/notificationService";

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const cursorRef = useRef<number | null>(null);
  const socketInitialized = useRef(false);

  useEffect(() => {
    let cancelled = false;

    fetchNotifications(null)
      .then((page) => {
        if (cancelled) return;
        setNotifications(page.notifications);
        setHasMore(page.nextCursor != null);
        cursorRef.current = page.nextCursor;
        const unread = page.notifications.filter((n) => !n.read).length;
        setUnreadCount(unread);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (socketInitialized.current) return;
    socketInitialized.current = true;

    const socket = getSocket();

    const onNewNotification = (notification: NotificationDto) => {
      setNotifications((prev) => [notification, ...prev]);
      if (!notification.read) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on("notification:new", onNewNotification);

    return () => {
      socket.off("notification:new", onNewNotification);
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || cursorRef.current == null) return;
    setLoading(true);
    try {
      const page = await fetchNotifications(cursorRef.current);
      setNotifications((prev) => {
        const existing = new Set(prev.map((n) => n.id));
        const newer = page.notifications.filter((n) => !existing.has(n.id));
        return [...prev, ...newer];
      });
      setHasMore(page.nextCursor != null);
      cursorRef.current = page.nextCursor;
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading]);

  const markRead = useCallback(async (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markNotificationRead(id).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await markAllNotificationsRead().catch(() => {});
  }, []);

  return {
    notifications,
    unreadCount,
    hasMore,
    loading,
    loadMore,
    markRead,
    markAllRead,
  };
}

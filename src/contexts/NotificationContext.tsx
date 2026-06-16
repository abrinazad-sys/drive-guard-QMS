import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { useAuth } from "@/contexts/AuthContext";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead, type NotificationDto } from "@/services/notificationService";

interface NotificationCtx {
  notifications: NotificationDto[];
  unreadCount: number;
  hasMore: boolean;
  loading: boolean;
  loadMore: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationCtx | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const cursorRef = useRef<number | null>(null);

  // Re-fetch notifications when user changes (login) or clear on logout
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchNotifications(null)
      .then((page) => {
        if (cancelled) return;
        setNotifications(page.notifications);
        setHasMore(page.nextCursor != null);
        cursorRef.current = page.nextCursor;
        setUnreadCount(page.notifications.filter((n) => !n.read).length);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    const socket = getSocket();

    const onNew = (notification: NotificationDto) => {
      setNotifications((prev) => [notification, ...prev]);
      if (!notification.read) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on("notification:new", onNew);
    return () => { socket.off("notification:new", onNew); };
  }, []);

  const loadMore = async () => {
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
  };

  const markRead = async (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markNotificationRead(id).catch(() => {});
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await markAllNotificationsRead().catch(() => {});
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, hasMore, loading, loadMore, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotificationContext must be used within NotificationProvider");
  return ctx;
}

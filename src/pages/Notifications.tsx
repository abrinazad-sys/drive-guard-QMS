import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, MessageSquare, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Notifications() {
  const { user } = useAuth();
  const { notifications, unreadCount, hasMore, loading, loadMore, markRead, markAllRead } = useNotificationContext();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  const list = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.read;
  });

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay up to date with your QMS activity."
        actions={
          <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        }
      />
      <Tabs defaultValue="all" onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread {unreadCount > 0 && `(${unreadCount})`}</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>
        {(["all", "unread", "read"] as const).map((f) => (
          <TabsContent key={f} value={f} className="mt-4">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="space-y-2 max-h-[70vh] overflow-y-auto pr-1"
            >
              {list.length === 0 ? (
                <Card className="p-12 text-center">
                  <Bell className="h-8 w-8 mx-auto opacity-40 mb-2" />
                  <div className="text-muted-foreground">No notifications</div>
                </Card>
              ) : (
                list.map((n) => (
                  <Card
                    key={n.id}
                    onClick={() => { if (!n.read) markRead(n.id); }}
                    className={cn(
                      "p-4 cursor-pointer hover:bg-accent transition flex items-start gap-3",
                      !n.read && "border-l-4 border-l-primary",
                    )}
                  >
                    <div className="h-9 w-9 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-sm", !n.read && "font-semibold")}>
                        {n.title}
                      </div>
                      {n.message && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.message}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatTime(n.createdAt)}
                      </div>
                      {n.type === "mention" && n.metadata?.fileId && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 mt-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            const fileId = n.metadata!.fileId as string;
                            const fileName = (n.metadata!.fileName as string) || fileId;
                            navigate(`/documents?chatFileId=${encodeURIComponent(fileId)}&chatFileName=${encodeURIComponent(fileName)}`);
                          }}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          See chat
                        </Button>
                      )}
                    </div>
                    {!n.read && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                    )}
                  </Card>
                ))
              )}
              {loading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

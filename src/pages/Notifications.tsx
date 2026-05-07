import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { notifications as initial } from "@/lib/mock-data";
import { PageHeader } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState(user?.role === "admin" ? initial.admin : initial.employee);

  const markAll = () => setItems(items.map(i => ({ ...i, read: true })));
  const markOne = (id: string) => setItems(items.map(i => i.id === id ? { ...i, read: true } : i));

  const list = (filter: "all" | "unread" | "read") =>
    items.filter(i => filter === "all" || (filter === "unread" ? !i.read : i.read));

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Stay up to date with your QMS activity." actions={
        <Button variant="outline" onClick={markAll}><CheckCheck className="h-4 w-4 mr-2" />Mark all as read</Button>
      } />
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>
        {(["all", "unread", "read"] as const).map(f => (
          <TabsContent key={f} value={f} className="space-y-2 mt-4">
            {list(f).length === 0 ? (
              <Card className="p-12 text-center"><Bell className="h-8 w-8 mx-auto opacity-40 mb-2" /><div className="text-muted-foreground">No notifications</div></Card>
            ) : list(f).map(n => (
              <Card key={n.id} onClick={() => markOne(n.id)} className={cn("p-4 cursor-pointer hover:bg-accent transition flex items-start gap-3", !n.read && "border-l-4 border-l-primary")}>
                <div className="h-9 w-9 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0"><Bell className="h-4 w-4" /></div>
                <div className="flex-1">
                  <div className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.time}</div>
                </div>
                {!n.read && <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

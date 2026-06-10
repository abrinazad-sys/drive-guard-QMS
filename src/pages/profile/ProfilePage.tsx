import { PageHeader } from "@/components/shared";
import { useAuth } from "@/contexts/AuthContext";
import {
  useTheme,
  ACCENTS,
  type ThemeMode,
  type Accent,
} from "@/contexts/ThemeContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sun, Moon, Monitor, Check, RotateCcw, Loader2, Clock, Shield, Globe, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ProfileForm } from "./forms/ProfileForm";
import { ChangePasswordForm } from "./forms/ChangePasswordForm";
import { useAuditLogs } from "@/services/auditService";

export function ProfilePage() {
  const { user } = useAuth();
  const { mode, accent, setMode, setAccent, previewMode, previewAccent, clearPreview } = useTheme();
  const [pendingMode, setPendingMode] = useState<ThemeMode>(mode);
  const [pendingAccent, setPendingAccent] = useState<Accent>(accent);

  useEffect(() => {
    return () => clearPreview();
  }, [clearPreview]);
  
  const { data: auditData, isLoading: loadingLogs } = useAuditLogs({ 
    search: user?.name,
    limit: 10 
  });
  const logs = auditData?.logs || [];

  const handleSave = () => {
    setMode(pendingMode);
    setAccent(pendingAccent);
    toast.success("Appearance saved");
  };

  const handleReset = () => {
    setPendingMode("system");
    setPendingAccent("blue");
    previewMode("system");
    previewAccent("blue");
    toast.success("Reset to defaults");
  };

  const selectMode = (v: ThemeMode) => {
    setPendingMode(v);
    previewMode(v);
  };

  const selectAccent = (v: Accent) => {
    setPendingAccent(v);
    previewAccent(v);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile Settings"
        description="Manage your account, security and appearance preferences."
      />

      <Tabs defaultValue="info">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="info">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          {/* <TabsTrigger value="activity">Activity</TabsTrigger> */}
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <ProfileForm
              initialName={user?.name || ""}
              email={user?.email || ""}
            />
            <ChangePasswordForm />
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <Card className="rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-none max-w-full">
            <CardHeader className="px-10 pt-10 pb-4">
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Choose how QMS looks for you</CardDescription>
            </CardHeader>
            <CardContent className="px-10 pb-10 space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Theme</h4>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { v: "light", icon: Sun, label: "Light" },
                      { v: "dark", icon: Moon, label: "Dark" },
                      { v: "system", icon: Monitor, label: "System" },
                    ] as { v: ThemeMode; icon: any; label: string }[]
                  ).map((o) => (
                    <button
                      key={o.v}
                      onClick={() => selectMode(o.v)}
                      className={cn(
                        "p-4 rounded-lg border-2 transition flex flex-col items-center gap-2",
                        pendingMode === o.v
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      <o.icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Accent Colour</h4>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => selectAccent(a.value as Accent)}
                      className={cn(
                        "p-3 rounded-lg border-2 transition flex flex-col items-center gap-2",
                        pendingAccent === a.value
                          ? "border-primary"
                          : "border-border hover:border-muted-foreground",
                      )}
                    >
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `hsl(${a.hsl})` }}
                      >
                        {pendingAccent === a.value && (
                          <Check className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <span className="text-xs font-medium">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Preview</h4>
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm">Primary</Button>
                    <Button size="sm" variant="outline">
                      Outline
                    </Button>
                    <Button size="sm" variant="secondary">
                      Secondary
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Badge>Badge</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  className="rounded-full"
                >
                  Save preferences
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="rounded-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card className="rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-none max-w-full">
            <CardHeader className="px-10 pt-10 pb-4">
              <CardTitle>Security Activity</CardTitle>
              <CardDescription>Recent login and action history for your account</CardDescription>
            </CardHeader>
            <CardContent className="px-10 pb-10 space-y-4">
              {loadingLogs ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : logs.length > 0 ? (
                <div className="space-y-4">
                  {logs.map((l) => (
                    <div
                      key={l.id}
                      className="p-4 rounded-2xl bg-muted/50 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-muted"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{l.action.replace(/_/g, ' ')}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {new Date(l.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">IP:</span>
                          <span className="font-mono font-medium">{l.ipAddress}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Terminal className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Browser:</span>
                          <span className="font-medium">{l.userBrowser}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">OS:</span>
                          <span className="font-medium">{l.userOS}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>No recent activity found for your account.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


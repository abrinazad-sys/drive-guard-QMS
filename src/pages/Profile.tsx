import { PageHeader } from "@/components/shared";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, ACCENTS, type ThemeMode, type Accent } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, Monitor, Check, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";
import { useUpdatePassword, getApiErrorMessage } from "@/services/authService";

export default function Profile() {
  const { user } = useAuth();
  const { mode, accent, setMode, setAccent, reset } = useTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const updatePasswordMutation = useUpdatePassword();

  const initials = user?.name ? user.name.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase() : "U";

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    updatePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success("Password updated successfully");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err));
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Profile Settings" description="Manage your account, security and appearance preferences." />
      <Tabs defaultValue="info">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="info">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20"><AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials}</AvatarFallback></Avatar>
                <div><div className="font-semibold text-lg">{user?.name}</div><Badge variant="secondary" className="capitalize mt-1">{user?.role}</Badge></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Full name</Label><Input defaultValue={user?.name} readOnly /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input defaultValue={user?.email} readOnly /></div>
              </div>
              <Button onClick={() => toast.success("Profile updated")}>Save changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Password & Security</CardTitle><CardDescription>Update your account password</CardDescription></CardHeader>
            <CardContent className="space-y-3 max-w-md">
              <div className="space-y-1.5">
                <Label>Current password</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>New password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm new password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <Button onClick={handlePasswordUpdate} disabled={updatePasswordMutation.isPending}>
                {updatePasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Change password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Theme</CardTitle><CardDescription>Choose how QMS looks for you</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { v: "light", icon: Sun, label: "Light" },
                  { v: "dark", icon: Moon, label: "Dark" },
                  { v: "system", icon: Monitor, label: "System" },
                ] as { v: ThemeMode; icon: any; label: string }[]).map(o => (
                  <button key={o.v} onClick={() => setMode(o.v)} className={cn("p-4 rounded-lg border-2 transition flex flex-col items-center gap-2", mode === o.v ? "border-primary bg-accent" : "border-border hover:bg-muted")}>
                    <o.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{o.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Accent Colour</CardTitle><CardDescription>Choose your preferred accent</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {ACCENTS.map(a => (
                  <button key={a.value} onClick={() => setAccent(a.value as Accent)} className={cn("p-3 rounded-lg border-2 transition flex flex-col items-center gap-2", accent === a.value ? "border-primary" : "border-border hover:border-muted-foreground")}>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `hsl(${a.hsl})` }}>
                      {accent === a.value && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <span className="text-xs font-medium">{a.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Theme Preview</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2"><Button>Primary button</Button><Button variant="outline">Outline</Button><Button variant="secondary">Secondary</Button></div>
              <div className="flex gap-2"><Badge>Badge</Badge><Badge variant="secondary">Secondary</Badge></div>
              <Card className="p-4"><div className="font-semibold">Sample card</div><a href="#" className="text-primary hover:underline text-sm">Sample link</a></Card>
              <div className="flex gap-2">
                <Button onClick={() => toast.success("Appearance saved")}>Save preferences</Button>
                <Button variant="outline" onClick={() => { reset(); toast.success("Reset to defaults"); }}><RotateCcw className="h-4 w-4 mr-2" />Reset</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                "Logged in from Chrome on macOS — Today, 09:12",
                "Downloaded Employee Handbook.pdf — Today, 09:50",
                "Previewed Quality Manual v3.docx — Yesterday, 14:20",
                "Updated profile — 3 days ago",
              ].map((t, i) => <div key={i} className="p-3 rounded-lg bg-muted">{t}</div>)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

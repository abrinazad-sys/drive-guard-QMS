import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setTimeout(() => {
      const r = login(email, password);
      setLoading(false);
      if (!r.success) setError(r.error || "Login failed");
      else nav("/dashboard");
    }, 600);
  };

  const fill = (e: string) => { setEmail(e); setPassword("password123"); };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary-soft">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">Q</div>
          <div>
            <div className="text-2xl font-bold tracking-tight">QMS</div>
            <div className="text-xs text-muted-foreground">Quality Management System</div>
          </div>
        </div>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>Access your secure document workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass">Password</Label>
                <Input id="pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                  Remember me
                </label>
                <button type="button" onClick={() => setForgot(true)} className="text-sm text-primary hover:underline">Forgot password?</button>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 p-4 rounded-lg bg-muted border border-border">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
                <ShieldCheck className="h-3 w-3" /> DEMO ACCOUNTS
              </div>
              <div className="space-y-1.5">
                <button onClick={() => fill("admin@qms.com")} type="button" className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-background flex justify-between">
                  <span className="font-medium">admin@qms.com</span><span className="text-muted-foreground">Admin</span>
                </button>
                <button onClick={() => fill("employee@qms.com")} type="button" className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-background flex justify-between">
                  <span className="font-medium">employee@qms.com</span><span className="text-muted-foreground">Employee</span>
                </button>
                <div className="text-[11px] text-muted-foreground pt-1 border-t border-border mt-1">Password: password123</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={forgot} onOpenChange={setForgot}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>Enter your email and we'll send you a reset link.</DialogDescription>
          </DialogHeader>
          <Input placeholder="you@company.com" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setForgot(false)}>Cancel</Button>
            <Button onClick={() => { setForgot(false); toast.success("Password reset email sent"); }}>Send link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

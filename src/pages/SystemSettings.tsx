import { PageHeader } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function SystemSettings() {
  return (
    <div className="space-y-6">
      <PageHeader title="System Settings" description="Configure global QMS preferences." />
      <Tabs defaultValue="company">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="sync">Sync</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-4">
          <Card><CardHeader><CardTitle>Company Profile</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Company name" defaultValue="Example Company Ltd" />
              <Field label="Email" defaultValue="info@examplecompany.com" />
              <Field label="Phone" defaultValue="+44 20 7946 0000" />
              <Field label="Website" defaultValue="https://examplecompany.com" />
              <Field label="Address" defaultValue="221B Baker Street, London" className="md:col-span-2" />
              <Button className="md:col-span-2 w-fit" onClick={() => toast.success("Saved")}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="branding" className="mt-4"><Card><CardHeader><CardTitle>Branding</CardTitle><CardDescription>Default theme and accent for new users</CardDescription></CardHeader><CardContent>Configure in your Profile → Appearance.</CardContent></Card></TabsContent>
        <TabsContent value="security" className="mt-4">
          <Card><CardHeader><CardTitle>Security Settings</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Field label="Minimum password length" type="number" defaultValue="10" />
              <Toggle label="Require uppercase letters" />
              <Toggle label="Require numbers" />
              <Toggle label="Require symbols" />
              <Field label="Session timeout (minutes)" type="number" defaultValue="60" />
              <Toggle label="Force password reset for new users" defaultChecked />
              <Field label="Disable inactive users after (days)" type="number" defaultValue="90" />
              <Button onClick={() => toast.success("Saved")}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sync" className="mt-4">
          <Card><CardHeader><CardTitle>Sync Settings</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Field label="Auto-sync frequency (minutes)" type="number" defaultValue="15" />
              <Toggle label="Retry failed syncs automatically" defaultChecked />
              <Field label="Maximum retry attempts" type="number" defaultValue="3" />
              <Button onClick={() => toast.success("Manual sync started")}>Run manual sync</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="mt-4">
          <Card><CardHeader><CardTitle>Notification Settings</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Toggle label="Email admins on sync failure" defaultChecked />
              <Toggle label="Notify users on access grant" defaultChecked />
              <Toggle label="Notify users on access revoke" defaultChecked />
              <Toggle label="Daily audit summary email" />
              <Button onClick={() => toast.success("Saved")}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <Card><CardHeader><CardTitle>Audit Settings</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Field label="Audit retention period (days)" type="number" defaultValue="365" />
              <Toggle label="Track downloads" defaultChecked />
              <Toggle label="Track previews" defaultChecked />
              <Button variant="outline" onClick={() => toast.success("Audit data export started")}>Export audit data</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, className, ...props }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <div className={`space-y-1.5 ${className || ""}`}><Label>{label}</Label><Input {...props} /></div>;
}
function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return <label className="flex items-center justify-between text-sm py-1"><span>{label}</span><Switch defaultChecked={defaultChecked} /></label>;
}

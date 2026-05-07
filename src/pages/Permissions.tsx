import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared";
import { users, folders, initialPermissions, groups } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Check, Minus, FolderOpen, UserPlus, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Permissions() {
  const employees = users.filter(u => u.role === "employee");
  const [permissions, setPermissions] = useState<Record<string, string[]>>(initialPermissions);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [folderSearch, setFolderSearch] = useState("");
  const [revokeOpen, setRevokeOpen] = useState(false);

  const visibleUsers = useMemo(() => employees.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())), [userSearch, employees]);
  const visibleFolders = useMemo(() => folders.filter(f => f.name.toLowerCase().includes(folderSearch.toLowerCase())), [folderSearch]);
  const hiddenUsers = selectedUsers.filter(id => !visibleUsers.find(u => u.id === id)).length;
  const hiddenFolders = selectedFolders.filter(id => !visibleFolders.find(f => f.id === id)).length;

  const toggle = (arr: string[], setArr: (v: string[]) => void, id: string) => setArr(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);

  const grant = () => {
    setPermissions(prev => {
      const n = { ...prev };
      selectedUsers.forEach(uid => { n[uid] = Array.from(new Set([...(n[uid] || []), ...selectedFolders])); });
      return n;
    });
    toast.success(`Access granted to ${selectedUsers.length} user${selectedUsers.length > 1 ? "s" : ""} for ${selectedFolders.length} folder${selectedFolders.length > 1 ? "s" : ""}`);
  };
  const revoke = () => {
    setPermissions(prev => {
      const n = { ...prev };
      selectedUsers.forEach(uid => { n[uid] = (n[uid] || []).filter(fid => !selectedFolders.includes(fid)); });
      return n;
    });
    setRevokeOpen(false);
    toast.success(`Access revoked from ${selectedUsers.length} user${selectedUsers.length > 1 ? "s" : ""} for ${selectedFolders.length} folder${selectedFolders.length > 1 ? "s" : ""}`);
  };

  const canAct = selectedUsers.length > 0 && selectedFolders.length > 0;

  return (
    <div className="space-y-6 pb-28">
      <PageHeader title="Permission Management" description="Grant or revoke folder access for users and groups." />

      <Tabs defaultValue="direct">
        <TabsList>
          <TabsTrigger value="direct">Direct Access</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="direct" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PanelCard title="Users" count={selectedUsers.length} hidden={hiddenUsers}>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search users..." className="pl-9" />
              </div>
              <SelectAll
                onAll={() => setSelectedUsers(Array.from(new Set([...selectedUsers, ...visibleUsers.map(u => u.id)])))}
                onNone={() => setSelectedUsers(selectedUsers.filter(id => !visibleUsers.find(u => u.id === id)))}
              />
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {visibleUsers.map(u => {
                  const sel = selectedUsers.includes(u.id);
                  return (
                    <button key={u.id} onClick={() => toggle(selectedUsers, setSelectedUsers, u.id)} className={cn("w-full flex items-center gap-3 p-2.5 rounded-lg border transition", sel ? "border-primary bg-accent" : "border-transparent hover:bg-muted")}>
                      <Checkbox checked={sel} />
                      <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary-soft text-primary text-xs">{u.name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-sm font-medium truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                      <Badge variant="secondary" className="capitalize text-[10px]">{u.role}</Badge>
                    </button>
                  );
                })}
              </div>
            </PanelCard>

            <PanelCard title="Folders" count={selectedFolders.length} hidden={hiddenFolders}>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={folderSearch} onChange={(e) => setFolderSearch(e.target.value)} placeholder="Search folders..." className="pl-9" />
              </div>
              <SelectAll
                onAll={() => setSelectedFolders(Array.from(new Set([...selectedFolders, ...visibleFolders.map(f => f.id)])))}
                onNone={() => setSelectedFolders(selectedFolders.filter(id => !visibleFolders.find(f => f.id === id)))}
              />
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {visibleFolders.map(f => {
                  const sel = selectedFolders.includes(f.id);
                  return (
                    <button key={f.id} onClick={() => toggle(selectedFolders, setSelectedFolders, f.id)} className={cn("w-full flex items-center gap-3 p-2.5 rounded-lg border transition", sel ? "border-primary bg-accent" : "border-transparent hover:bg-muted")}>
                      <Checkbox checked={sel} />
                      <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-sm font-medium truncate">{f.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{f.parent}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </PanelCard>
          </div>

          {canAct && (
            <Card>
              <CardHeader>
                <CardTitle>Permission Matrix</CardTitle>
                <CardDescription>Current access for selected users and folders</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium">User</th>
                      {selectedFolders.map(fid => {
                        const f = folders.find(x => x.id === fid);
                        return <th key={fid} className="text-center py-2 px-3 font-medium whitespace-nowrap">{f?.name}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUsers.map(uid => {
                      const u = users.find(x => x.id === uid);
                      return (
                        <tr key={uid} className="border-b border-border last:border-0">
                          <td className="py-2 px-3 font-medium whitespace-nowrap">{u?.name}</td>
                          {selectedFolders.map(fid => {
                            const has = permissions[uid]?.includes(fid);
                            return <td key={fid} className="text-center py-2 px-3">
                              {has ? <Check className="h-4 w-4 text-success mx-auto" /> : <Minus className="h-4 w-4 text-muted-foreground mx-auto" />}
                            </td>;
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" />Access Options</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center justify-between text-sm"><span>Apply to subfolders (inheritance)</span><Switch defaultChecked /></label>
              <label className="flex items-center justify-between text-sm"><span>Set access expiry date</span><Switch /></label>
              <Input type="date" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-3">
          {groups.map(g => (
            <Card key={g.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" />{g.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">{g.members} members · {g.folders.length} folders</div>
                  <div className="flex flex-wrap gap-1 mt-2">{g.folders.map(f => <Badge key={f} variant="secondary">{f}</Badge>)}</div>
                </div>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-3 z-40">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4">
          <div className="text-sm text-muted-foreground">
            <strong>{selectedUsers.length}</strong> users · <strong>{selectedFolders.length}</strong> folders selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={!canAct} onClick={() => setRevokeOpen(true)}>Revoke access</Button>
            <Button disabled={!canAct} onClick={grant}>Grant access</Button>
          </div>
        </div>
      </div>

      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke access?</DialogTitle>
            <DialogDescription>This will remove access for the following users from the selected folders.</DialogDescription>
          </DialogHeader>
          <div className="text-sm space-y-2">
            <div><strong>Users:</strong> {selectedUsers.map(id => users.find(u => u.id === id)?.name).join(", ")}</div>
            <div><strong>Folders:</strong> {selectedFolders.map(id => folders.find(f => f.id === id)?.name).join(", ")}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={revoke}>Confirm revoke</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PanelCard({ title, count, hidden, children }: { title: string; count: number; hidden: number; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {hidden > 0 && <span className="text-xs text-muted-foreground">{count} selected, {hidden} hidden</span>}
          {hidden === 0 && count > 0 && <Badge variant="secondary">{count} selected</Badge>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function SelectAll({ onAll, onNone }: { onAll: () => void; onNone: () => void }) {
  return (
    <div className="flex gap-2 text-xs mb-2">
      <button onClick={onAll} className="text-primary hover:underline">Select all visible</button>
      <span className="text-muted-foreground">·</span>
      <button onClick={onNone} className="text-muted-foreground hover:text-foreground">Clear visible</button>
    </div>
  );
}

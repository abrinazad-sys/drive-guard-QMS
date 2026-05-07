import { useState } from "react";
import { PageHeader, StatusBadge } from "@/components/shared";
import { users as initialUsers, type User } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Download, MoreHorizontal, KeyRound } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function Users() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const filtered = users.filter(u =>
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
    (roleFilter === "all" || u.role === roleFilter) &&
    (statusFilter === "all" || (statusFilter === "active" ? u.active : !u.active))
  );

  const toggleActive = (id: string) => {
    setUsers(us => us.map(u => u.id === id ? { ...u, active: !u.active } : u));
    toast.success("User status updated");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage your organisation's QMS user accounts." actions={
        <>
          <Button variant="outline" onClick={() => toast.success("User list exported")}><Download className="h-4 w-4 mr-2" />Export</Button>
          <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Add user</Button>
        </>
      } />
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Sync</TableHead><TableHead>Last Login</TableHead><TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium whitespace-nowrap">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{u.email}</TableCell>
                    <TableCell><Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize">{u.role}</Badge></TableCell>
                    <TableCell><StatusBadge status={u.active ? "active" : "inactive"} /></TableCell>
                    <TableCell><StatusBadge status={u.syncStatus} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{u.lastLogin}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditUser(u)}>Edit user</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.success("Password reset email sent")}><KeyRound className="h-3 w-3 mr-2" />Reset password</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleActive(u.id)}>{u.active ? "Deactivate" : "Activate"}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No users found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create user</DialogTitle><DialogDescription>Add a new user to QMS</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Full name</Label><Input placeholder="Jane Doe" /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input placeholder="jane@company.com" /></div>
            <div className="space-y-1.5"><Label>Role</Label>
              <Select defaultValue="employee">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="employee">Employee</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Initial password</Label><Input type="password" placeholder="••••••••" /></div>
            <label className="flex items-center gap-2 text-sm"><Checkbox defaultChecked />Force password reset on first login</label>
            <label className="flex items-center justify-between text-sm"><span>Active</span><Switch defaultChecked /></label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => { setCreateOpen(false); toast.success("User created"); }}>Create user</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit user</DialogTitle></DialogHeader>
          {editUser && (
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Full name</Label><Input defaultValue={editUser.name} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input defaultValue={editUser.email} /></div>
              <div className="space-y-1.5"><Label>Role</Label>
                <Select defaultValue={editUser.role}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="employee">Employee</SelectItem></SelectContent>
                </Select>
              </div>
              <label className="flex items-center justify-between text-sm"><span>Active</span><Switch defaultChecked={editUser.active} /></label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={() => { setEditUser(null); toast.success("User updated"); }}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from "react";
import type { AxiosError } from "axios";
import { PageHeader, StatusBadge } from "@/components/shared";
import { type User } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  KeyRound,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  useAdminUsers,
  useCreateUser,
  useUpdateUserAdmin,
  useResetPasswordAdmin,
  type UserDto,
} from "@/services/userService";
import { getApiErrorMessage } from "@/services/authService";
import { cn } from "@/lib/utils";
import { exportToPdf } from "@/utils/exportPdf";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const StatusToggle = ({
  active,
  onToggle,
  disabled,
}: {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onToggle}
    className={cn(
      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      active ? "bg-primary" : "bg-muted",
    )}
  >
    <div
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
        active ? "translate-x-5" : "translate-x-0",
      )}
    />
  </button>
);

export default function Users() {
  const { data: users = [], isLoading, refetch } = useAdminUsers();
  const createUserMutation = useCreateUser();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserDto | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState<UserDto | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserDto | null>(
    null,
  );
  const [tempPassword, setTempPassword] = useState("");
  const resetPasswordMutation = useResetPasswordAdmin();

  // Create form state
  const [newName, setNewName] = useState("");
  const [newEmailPrefix, setNewEmailPrefix] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newPassword, setNewPassword] = useState("");
  const [newActive, setNewActive] = useState(true);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editActive, setEditActive] = useState(true);
  const updateUserMutation = useUpdateUserAdmin();

  useEffect(() => {
    if (editUser) {
      setEditName(editUser.name);
      setEditRole(editUser.role);
      setEditActive(editUser.isActive);
    }
  }, [editUser]);

  useEffect(() => {
    if (createOpen) {
      setNewPassword("");
      setShowPassword(false);
    }
  }, [createOpen]);

  const filtered = users.filter(
    (u) =>
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())) &&
      (roleFilter === "all" || u.role === roleFilter) &&
      (statusFilter === "all" ||
        (statusFilter === "active" ? u.isActive : !u.isActive)),
  );

  const handleCreate = () => {
    if (!newName || !newEmailPrefix || !newRole) {
      toast.error("Please fill all required fields");
      return;
    }
    const fullEmail = `${newEmailPrefix}@bedatasolutions.com`;
    createUserMutation.mutate(
      {
        name: newName,
        email: fullEmail,
        role: newRole,
        password: newPassword || undefined,
      },
      {
        onSuccess: () => {
          toast.success("User created successfully");
          setCreateOpen(false);
          refetch();
          setNewName("");
          setNewEmailPrefix("");
          setNewPassword("");
        },
        onError: (err) => toast.error(getApiErrorMessage(err as AxiosError)),
      },
    );
  };

  const generateStrongPassword = () => {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghijkmnopqrstuvwxyz";
    const digits = "23456789";
    const symbols = "!@#$%&*?";
    const all = `${upper}${lower}${digits}${symbols}`;

    const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

    const passwordChars = [
      pick(upper),
      pick(lower),
      pick(digits),
      pick(symbols),
      ...Array.from({ length: 10 }, () => pick(all)),
    ];

    for (let i = passwordChars.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
    }

    return passwordChars.join("");
  };

  const handleUpdate = () => {
    if (!editUser) return;
    updateUserMutation.mutate(
      {
        id: editUser.id,
        data: { name: editName, role: editRole, isActive: editActive },
      },
      {
        onSuccess: () => {
          toast.success("User updated successfully");
          setEditUser(null);
          refetch();
        },
        onError: (err) => toast.error(getApiErrorMessage(err as AxiosError)),
      },
    );
  };

  const toggleActive = (u: UserDto) => {
    // We reuse the update mutation for toggling status
    const tempMutation = updateUserMutation; // Note: id is bound in the hook, so this might be tricky if not careful
    // But since we have useUpdateUser(editUser?.id || 0), we should use a different approach or just setEditUser before toggling.
    setEditUser(u);
    setEditName(u.name);
    setEditRole(u.role);
    setEditActive(!u.isActive);
  };

  const handleConfirmToggle = () => {
    if (!userToToggle) return;
    updateUserMutation.mutate(
      {
        id: userToToggle.id,
        data: {
          name: userToToggle.name,
          role: userToToggle.role,
          isActive: !userToToggle.isActive,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            `User ${!userToToggle.isActive ? "activated" : "deactivated"} successfully`,
          );
          refetch();
          setConfirmOpen(false);
          setUserToToggle(null);
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err as AxiosError));
          setConfirmOpen(false);
          setUserToToggle(null);
        },
      },
    );
  };

  const handleResetPassword = () => {
    if (!resetPasswordUser || !tempPassword) {
      toast.error("Please enter a temporary password");
      return;
    }
    resetPasswordMutation.mutate(
      { id: resetPasswordUser.id, temporaryPassword: tempPassword },
      {
        onSuccess: (res) => {
          toast.success(res.data.message);
          setResetPasswordUser(null);
          setTempPassword("");
          refetch();
        },
        onError: (err) => toast.error(getApiErrorMessage(err as AxiosError)),
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage your organisation's QMS user accounts."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                if (filtered.length === 0) {
                  toast.error("No users to export");
                  return;
                }
                exportToPdf({
                  title: "User List",
                  subtitle: `${filtered.length} users · Generated ${new Date().toLocaleString()}`,
                  columns: ["Name", "Email", "Role", "Created", "Status"],
                  rows: filtered.map(u => [
                    u.name,
                    u.email,
                    u.role.charAt(0).toUpperCase() + u.role.slice(1),
                    new Date(u.createdAt).toLocaleDateString(),
                    u.isActive ? "Active" : "Inactive",
                  ]),
                  filename: `users_${new Date().toISOString().slice(0, 10)}.pdf`,
                });
                toast.success("User list exported as PDF");
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </>
        }
      />
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="users-search"
                name="users-search"
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                autoComplete="off"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarImage src={u.profilePhotoUrl || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {u.name
                              .split(" ")
                              .map((s) => s[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {u.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={u.role === "admin" ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={u.isActive ? "active" : "inactive"}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusToggle
                          active={u.isActive}
                          disabled={u.role === "admin"}
                          onToggle={() => {
                            setUserToToggle(u);
                            setConfirmOpen(true);
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditUser(u)}>
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setResetPasswordUser(u);
                                setTempPassword("");
                              }}
                            >
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={u.role === "admin"}
                              onClick={() => {
                                setUserToToggle(u);
                                setConfirmOpen(true);
                              }}
                            >
                              {/* {u.isActive ? "Deactivate" : "Activate"} */}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 text-muted-foreground"
                      >
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Create User</DialogTitle>
            {/* <DialogDescription>Add a new user to QMS</DialogDescription> */}
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-user-name">Full name</Label>
              <Input
                id="new-user-name"
                name="new-user-name"
                placeholder="Jane Doe"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-user-email">Email</Label>
              <div className="relative">
                <Input
                  id="new-user-email"
                  name="new-user-email"
                  placeholder="jane.doe"
                  value={newEmailPrefix}
                  onChange={(e) => setNewEmailPrefix(e.target.value)}
                  className="pr-[165px]"
                  autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">
                  @bedatasolutions.com
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="new-user-password">Initial password</Label>
                <button
                  type="button"
                  onClick={() => setNewPassword(generateStrongPassword())}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Generate strong pass
                </button>
              </div>
              <div className="relative">
                <Input
                  id="new-user-password"
                  name="new-user-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {/* <label className="flex items-center gap-2 text-sm">
              <Checkbox defaultChecked />
              Force password reset on first login
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>Active</span>
              <Switch checked={newActive} onCheckedChange={setNewActive} />
            </label> */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Full name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={editUser.email} readOnly disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center justify-between text-sm">
                <span>Active</span>
                <Switch checked={editActive} onCheckedChange={setEditActive} />
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {userToToggle?.isActive ? "deactivate" : "activate"} the account
              for <strong>{userToToggle?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToToggle(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmToggle();
              }}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!resetPasswordUser}
        onOpenChange={(open) => !open && setResetPasswordUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Reset User Password
            </DialogTitle>
            <DialogDescription>
              Set a temporary password for{" "}
              <strong>{resetPasswordUser?.name}</strong>. The user will be
              forced to change it on their next login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="temp-password">Temporary Password</Label>
              <div className="relative">
                <Input
                  id="temp-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter temporary password"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetPasswordUser(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending || !tempPassword}
            >
              {resetPasswordMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Confirm Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

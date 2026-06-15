import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  KeyRound,
  Loader2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  useAdminUsersPaginated,
  useCreateUser,
  useUpdateUserAdmin,
  useResetPasswordAdmin,
  useDeleteUser,
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
import { PasswordStrength } from "@/components/ui/password-strength";

const createUserFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  emailPrefix: z.string().min(1, "Email is required"),
  role: z.enum(["admin", "user"]),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Must contain 1 uppercase letter")
    .regex(/[a-z]/, "Must contain 1 lowercase letter")
    .regex(/[0-9]/, "Must contain 1 digit")
    .regex(/[^A-Za-z0-9]/, "Must contain 1 special character"),
});

type CreateUserFormData = z.infer<typeof createUserFormSchema>;

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
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data: paginated, isLoading, refetch } = useAdminUsersPaginated(page, 15, search);
  const users = paginated?.users ?? [];
  const total = paginated?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 10));
  const createUserMutation = useCreateUser();
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserDto | null>(null);
  const deleteUserMutation = useDeleteUser();
  const navigate = useNavigate();

  // Create form
  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      name: "",
      emailPrefix: "",
      role: "user",
      password: "",
    },
  });

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
      createForm.reset();
      setShowPassword(false);
    }
  }, [createOpen, createForm]);

  const filtered = users.filter(
    (u) =>
      (roleFilter === "all" || u.role === roleFilter) &&
      (statusFilter === "all" ||
        (statusFilter === "active" ? u.isActive : !u.isActive)),
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCreate = (data: CreateUserFormData) => {
    const fullEmail = `${data.emailPrefix}@bedatasolutions.com`;
    createUserMutation.mutate(
      {
        name: data.name,
        email: fullEmail,
        role: data.role,
        password: data.password,
      },
      {
        onSuccess: () => {
          toast.success("User created successfully");
          setCreateOpen(false);
          refetch();
          createForm.reset();
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
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
        onError: (err) => toast.error(getApiErrorMessage(err)),
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
          toast.error(getApiErrorMessage(err));
          setConfirmOpen(false);
          setUserToToggle(null);
        },
      },
    );
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    deleteUserMutation.mutate(userToDelete.id, {
      onSuccess: () => {
        toast.success("User deleted successfully");
        setDeleteOpen(false);
        setUserToDelete(null);
        refetch();
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err));
        setDeleteOpen(false);
        setUserToDelete(null);
      },
    });
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
        onError: (err) => toast.error(getApiErrorMessage(err)),
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
                onChange={(e) => handleSearchChange(e.target.value)}
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
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={u.role === "admin"}
                              onClick={() => navigate(`/permissions?userId=${u.id}&tab=user-access`)}
                            >
                              <FolderOpen className="h-4 w-4 mr-2" />
                              Folder Permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setResetPasswordUser(u);
                                setTempPassword("");
                              }}
                            >
                              <KeyRound className="h-4 w-4 mr-2" />
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
                            <DropdownMenuItem
                              className="text-destructive"
                              disabled={u.role === "admin"}
                              onClick={() => {
                                setUserToDelete(u);
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
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
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {users.length} of {total} users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Create User</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-3">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="emailPrefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="jane.doe"
                          autoComplete="off"
                          className="pr-[165px]"
                          {...field}
                        />
                      </FormControl>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">
                        @bedatasolutions.com
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-3">
                      <FormLabel>Initial password</FormLabel>
                      <button
                        type="button"
                        onClick={() =>
                          createForm.setValue("password", generateStrongPassword(), {
                            shouldValidate: true,
                          })
                        }
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Generate strong pass
                      </button>
                    </div>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          className="pr-10"
                          {...field}
                        />
                      </FormControl>
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
                    <FormMessage />
                    <PasswordStrength password={field.value} />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Create User
                </Button>
              </DialogFooter>
            </form>
          </Form>
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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.name}</strong>?
              This will permanently remove the user from Auth0 and the local database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteUser();
              }}
              disabled={deleteUserMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

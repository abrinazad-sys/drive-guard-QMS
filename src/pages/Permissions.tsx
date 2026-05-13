import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared";
import { groups } from "@/lib/mock-data";
import { useAdminUsers } from "@/services/userService";
import { useFolders } from "@/services/fileService";
import { useGrantBulkPermissions, useRevokeBulkPermissions, useUserPermissions, useRevokePermission } from "@/services/permissionService";
import { auditService } from "@/services/auditService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Check,
  Minus,
  FolderOpen,
  UserPlus,
  Calendar,
  Trash2,
  Loader2,
  X,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Permissions() {
  const { data: allUsers = [], isLoading: loadingUsers } = useAdminUsers();
  const { data: allFolders = [], isLoading: loadingFolders } = useFolders();
  const bulkGrantMutation = useGrantBulkPermissions();
  const bulkRevokeMutation = useRevokeBulkPermissions();

  const employees = useMemo(() => allUsers.filter((u) => u.role === "user"), [allUsers]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [folderSearch, setFolderSearch] = useState("");
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [activeUserSearchId, setActiveUserSearchId] = useState<number | null>(null);
  const [userSearchQueryTab, setUserSearchQueryTab] = useState("");

  const visibleUsers = useMemo(
    () =>
      employees.filter((u) =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
      ),
    [userSearch, employees],
  );
  const visibleFolders = useMemo(
    () =>
      allFolders.filter((f) =>
        f.name.toLowerCase().includes(folderSearch.toLowerCase()),
      ),
    [folderSearch, allFolders],
  );
  const hiddenUsers = selectedUsers.filter(
    (id) => !visibleUsers.find((u) => u.id === id),
  ).length;
  const hiddenFolders = selectedFolders.filter(
    (id) => !visibleFolders.find((f) => f.id === id),
  ).length;

  const toggle = <T,>(arr: T[], setArr: (v: T[]) => void, id: T) =>
    setArr(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const grant = async () => {
    if (selectedUsers.length === 0 || selectedFolders.length === 0) return;

    try {
      // The API is per user, so we loop if multiple users are selected
      const promises = selectedUsers.map((userId) =>
        bulkGrantMutation.mutateAsync({
          userId,
          folderIds: selectedFolders,
        })
      );

      await Promise.all(promises);

      // Audit Log
      selectedUsers.forEach(userId => {
        const user = allUsers.find(u => u.id === userId);
        selectedFolders.forEach(fid => {
          const folderName = allFolders.find(f => f.id === fid)?.name;
          auditService.addLog({
            actor: "Admin", // Should ideally be from AuthContext
            role: "admin",
            action: "Granted access",
            target: user?.name || `User ${userId}`,
            folder: folderName || "Unknown Folder",
            status: "active"
          });
        });
      });

      toast.success(
        `Access granted to ${selectedUsers.length} user${selectedUsers.length > 1 ? "s" : ""} for ${selectedFolders.length} folder${selectedFolders.length > 1 ? "s" : ""}`
      );
      
      // Clear selection after success
      setSelectedUsers([]);
      setSelectedFolders([]);
    } catch (error) {
      // Audit Log for failure
      selectedUsers.forEach(userId => {
        const user = allUsers.find(u => u.id === userId);
        selectedFolders.forEach(fid => {
          const folderName = allFolders.find(f => f.id === fid)?.name;
          auditService.addLog({
            actor: "Admin",
            role: "admin",
            action: "Granted access",
            target: user?.name || `User ${userId}`,
            folder: folderName || "Unknown Folder",
            status: "deactive"
          });
        });
      });
    }
  };
  const revoke = async () => {
    if (selectedUsers.length === 0 || selectedFolders.length === 0) return;

    try {
      const promises = selectedUsers.map((userId) =>
        bulkRevokeMutation.mutateAsync({
          userId,
          folderIds: selectedFolders,
        })
      );

      await Promise.all(promises);

      // Audit Log
      selectedUsers.forEach(userId => {
        const user = allUsers.find(u => u.id === userId);
        selectedFolders.forEach(fid => {
          const folderName = allFolders.find(f => f.id === fid)?.name;
          auditService.addLog({
            actor: "Admin",
            role: "admin",
            action: "Revoked access",
            target: user?.name || `User ${userId}`,
            folder: folderName || "Unknown Folder",
            status: "active"
          });
        });
      });

      toast.success(
        `Access revoked from ${selectedUsers.length} user${selectedUsers.length > 1 ? "s" : ""} for ${selectedFolders.length} folder${selectedFolders.length > 1 ? "s" : ""}`
      );
      
      setRevokeOpen(false);
      setSelectedUsers([]);
      setSelectedFolders([]);
    } catch (error) {
      // Audit Log for failure
      selectedUsers.forEach(userId => {
        const user = allUsers.find(u => u.id === userId);
        selectedFolders.forEach(fid => {
          const folderName = allFolders.find(f => f.id === fid)?.name;
          auditService.addLog({
            actor: "Admin",
            role: "admin",
            action: "Revoked access",
            target: user?.name || `User ${userId}`,
            folder: folderName || "Unknown Folder",
            status: "deactive"
          });
        });
      });
    }
  };

  const isGranting = bulkGrantMutation.isPending;
  const isRevoking = bulkRevokeMutation.isPending;
  
  const { data: userPermissionsData, isLoading: loadingUserPermissions, refetch: refetchUserPermissions } = useUserPermissions(activeUserSearchId);
  const singleRevokeMutation = useRevokePermission();

  const filteredUsersForTab = useMemo(() => {
    if (!userSearchQueryTab) return [];
    return employees.filter(u => 
      u.name.toLowerCase().includes(userSearchQueryTab.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQueryTab.toLowerCase())
    ).slice(0, 5);
  }, [employees, userSearchQueryTab]);

  const canAct = selectedUsers.length > 0 && selectedFolders.length > 0 && !isGranting && !isRevoking;

  return (
    <div className="space-y-6 pb-28">
      <PageHeader
        title="Permission Management"
        description="Grant or revoke folder access for users and groups."
      />

      <Tabs defaultValue="direct">
        <TabsList>
          <TabsTrigger value="direct">Direct Access</TabsTrigger>
          <TabsTrigger value="user-access">User Access</TabsTrigger>
          {/* <TabsTrigger value="groups">Groups</TabsTrigger> */}
        </TabsList>

        <TabsContent value="direct" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PanelCard
              title="Users"
              count={selectedUsers.length}
              hidden={hiddenUsers}
            >
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="pl-9"
                />
              </div>
              <SelectAll
                onAll={() =>
                  setSelectedUsers(
                    Array.from(
                      new Set([
                        ...selectedUsers,
                        ...visibleUsers.map((u) => u.id),
                      ]),
                    ),
                  )
                }
                onNone={() =>
                  setSelectedUsers(
                    selectedUsers.filter(
                      (id) => !visibleUsers.find((u) => u.id === id),
                    ),
                  )
                }
              />
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {loadingUsers ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading users...</p>
                  </div>
                ) : visibleUsers.length > 0 ? (
                  visibleUsers.map((u) => {
                    const sel = selectedUsers.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() =>
                          toggle(selectedUsers, setSelectedUsers, u.id)
                        }
                        className={cn(
                          "w-full flex items-center gap-3 p-2.5 rounded-lg border transition",
                          sel
                            ? "border-primary bg-accent"
                            : "border-transparent hover:bg-muted",
                        )}
                      >
                        <Checkbox checked={sel} />
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary-soft text-primary text-xs">
                            {u.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-sm font-medium truncate">
                            {u.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {u.email}
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="capitalize text-[10px]"
                        >
                          {u.role}
                        </Badge>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground">No users found</p>
                  </div>
                )}
              </div>
            </PanelCard>

            <PanelCard
              title="Folders"
              count={selectedFolders.length}
              hidden={hiddenFolders}
            >
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={folderSearch}
                  onChange={(e) => setFolderSearch(e.target.value)}
                  placeholder="Search folders..."
                  className="pl-9"
                />
              </div>
              <SelectAll
                onAll={() =>
                  setSelectedFolders(
                    Array.from(
                      new Set([
                        ...selectedFolders,
                        ...visibleFolders.map((f) => f.id),
                      ]),
                    ),
                  )
                }
                onNone={() =>
                  setSelectedFolders(
                    selectedFolders.filter(
                      (id) => !visibleFolders.find((f) => f.id === id),
                    ),
                  )
                }
              />
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {loadingFolders ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading folders...</p>
                  </div>
                ) : visibleFolders.length > 0 ? (
                  visibleFolders.map((f) => {
                    const sel = selectedFolders.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        onClick={() =>
                          toggle(selectedFolders, setSelectedFolders, f.id)
                        }
                        className={cn(
                          "w-full flex items-center gap-3 p-2.5 rounded-lg border transition",
                          sel
                            ? "border-primary bg-accent"
                            : "border-transparent hover:bg-muted",
                        )}
                      >
                        <Checkbox checked={sel} />
                        <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-sm font-medium truncate">
                            {f.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {f.type}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground">No folders found</p>
                  </div>
                )}
              </div>
            </PanelCard>
          </div>

          {canAct && (
            <Card>
              <CardHeader>
                <CardTitle>Permission Matrix</CardTitle>
                <CardDescription>
                  Current access for selected users and folders
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium">User</th>
                      {selectedFolders.map((fid) => {
                        const f = allFolders.find((x) => x.id === fid);
                        return (
                          <th
                            key={fid}
                            className="text-center py-2 px-3 font-medium whitespace-nowrap"
                          >
                            {f?.name}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUsers.map((uid) => {
                      const u = allUsers.find((x) => x.id === uid);
                      return (
                        <tr
                          key={uid}
                          className="border-b border-border last:border-0"
                        >
                          <td className="py-2 px-3 font-medium whitespace-nowrap">
                            {u?.name}
                          </td>
                          {selectedFolders.map((fid) => {
                            return (
                              <td key={fid} className="text-center py-2 px-3">
                                {isGranting ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto" />
                                ) : (
                                  <Minus className="h-4 w-4 text-muted-foreground mx-auto" />
                                )}
                              </td>
                            );
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
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Access Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center justify-between text-sm">
                <span>Apply to subfolders (inheritance)</span>
                <Switch defaultChecked />
              </label>
              <label className="flex items-center justify-between text-sm">
                <span>Set access expiry date</span>
                <Switch />
              </label>
              <Input type="date" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-access" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>View User Permissions</CardTitle>
              <CardDescription>Search for a user to see all folders they have access to.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={userSearchQueryTab}
                  onChange={(e) => {
                    setUserSearchQueryTab(e.target.value);
                    if (!e.target.value) setActiveUserSearchId(null);
                  }}
                  placeholder="Search user by name or email..."
                  className="pl-9"
                />
                
                {filteredUsersForTab.length > 0 && !activeUserSearchId && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-background border border-border rounded-lg shadow-lg mt-1 p-1 max-h-[250px] overflow-y-auto">
                    {filteredUsersForTab.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setActiveUserSearchId(u.id);
                          setUserSearchQueryTab(u.name);
                        }}
                        className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-md transition-colors text-left"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary-soft text-primary text-xs">
                            {u.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {activeUserSearchId && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {userPermissionsData?.user.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-lg">{userPermissionsData?.user.name}</div>
                        <div className="text-sm text-muted-foreground">{userPermissionsData?.user.email}</div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setActiveUserSearchId(null);
                        setUserSearchQueryTab("");
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-primary" />
                      Permitted Folders ({userPermissionsData?.permissions.length || 0})
                    </h4>
                    
                    {loadingUserPermissions ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed rounded-xl">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Fetching permissions...</p>
                      </div>
                    ) : userPermissionsData?.permissions && userPermissionsData.permissions.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {userPermissionsData.permissions.map((perm) => {
                          const folder = allFolders.find(f => f.id === perm.folderId);
                          return (
                            <Card key={perm.permissionId} className="group hover:border-primary/30 transition-colors">
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <FolderOpen className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium truncate">{folder?.name || "Unknown Folder"}</div>
                                    <div className="text-[10px] text-muted-foreground">Granted on {new Date(perm.grantedAt).toLocaleDateString()}</div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  disabled={singleRevokeMutation.isPending}
                                  onClick={() => {
                                    singleRevokeMutation.mutate(
                                      { folderId: perm.folderId, userId: activeUserSearchId },
                                      {
                                        onSuccess: () => {
                                          const user = employees.find(u => u.id === activeUserSearchId);
                                          const folder = allFolders.find(f => f.id === perm.folderId);
                                          auditService.addLog({
                                            actor: "Admin",
                                            role: "admin",
                                            action: "Revoked access",
                                            target: user?.name || `User ${activeUserSearchId}`,
                                            folder: folder?.name || "Unknown Folder",
                                            status: "active"
                                          });
                                          toast.success("Access removed successfully");
                                          refetchUserPermissions();
                                        },
                                        onError: () => {
                                          const user = employees.find(u => u.id === activeUserSearchId);
                                          const folder = allFolders.find(f => f.id === perm.folderId);
                                          auditService.addLog({
                                            actor: "Admin",
                                            role: "admin",
                                            action: "Revoked access",
                                            target: user?.name || `User ${activeUserSearchId}`,
                                            folder: folder?.name || "Unknown Folder",
                                            status: "deactive"
                                          });
                                        }
                                      }
                                    );
                                  }}
                                >
                                  {singleRevokeMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 border border-dashed rounded-xl">
                        <FolderOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">This user has no folder permissions.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {!activeUserSearchId && !userSearchQueryTab && (
                <div className="text-center py-16 opacity-50">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Select a user to view their folder access rights.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* <TabsContent value="groups" className="space-y-3">
          {groups.map((g) => (
            <Card key={g.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" />
                    {g.name}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {g.members} members · {g.folders.length} folders
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {g.folders.map((f) => (
                      <Badge key={f} variant="secondary">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent> */}
      </Tabs>

      <div className="relative bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-3 z-40">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4">
          <div className="text-sm text-muted-foreground">
            <strong>{selectedUsers.length}</strong> users ·{" "}
            <strong>{selectedFolders.length}</strong> folders selected
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!canAct}
              onClick={() => setRevokeOpen(true)}
            >
              Revoke access
            </Button>
            <Button disabled={!canAct} onClick={grant} className="min-w-[120px]">
              {isGranting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Granting...
                </>
              ) : (
                "Grant access"
              )}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke access?</DialogTitle>
            <DialogDescription>
              This will remove access for the following users from the selected
              folders.
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm space-y-2">
            <div>
              <strong>Users:</strong>{" "}
              {selectedUsers
                .map((id) => allUsers.find((u) => u.id === id)?.name)
                .join(", ")}
            </div>
            <div>
              <strong>Folders:</strong>{" "}
              {selectedFolders
                .map((id) => allFolders.find((f) => f.id === id)?.name)
                .join(", ")}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeOpen(false)} disabled={isRevoking}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={revoke} disabled={isRevoking}>
              {isRevoking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Confirm revoke"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PanelCard({
  title,
  count,
  hidden,
  children,
}: {
  title: string;
  count: number;
  hidden: number;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {hidden > 0 && (
            <span className="text-xs text-muted-foreground">
              {count} selected, {hidden} hidden
            </span>
          )}
          {hidden === 0 && count > 0 && (
            <Badge variant="secondary">{count} selected</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function SelectAll({
  onAll,
  onNone,
}: {
  onAll: () => void;
  onNone: () => void;
}) {
  return (
    <div className="flex gap-2 text-xs mb-2">
      <button onClick={onAll} className="text-primary hover:underline">
        Select all visible
      </button>
      <span className="text-muted-foreground">·</span>
      <button
        onClick={onNone}
        className="text-muted-foreground hover:text-foreground"
      >
        Clear visible
      </button>
    </div>
  );
}

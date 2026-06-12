import { useMemo, useState, useEffect } from "react";
import { PageHeader } from "@/components/shared";
import { useAdminUsers } from "@/services/userService";
import { useFolders } from "@/services/fileService";
import { useGrantBulkPermissions, useRevokeBulkPermissions, useUserPermissions, useRevokePermission } from "@/services/permissionService";
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
  FolderOpen,
  Trash2,
  Loader2,
  X,
  User,
  UserCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Permissions() {
  const { data: allUsers = [], isLoading: loadingUsers } = useAdminUsers();
  const { data: allFolders = [], isLoading: loadingFolders } = useFolders();
  const bulkGrantMutation = useGrantBulkPermissions();
  const bulkRevokeMutation = useRevokeBulkPermissions();

  const employees = useMemo(() => allUsers.filter((u) => u.role === "user"), [allUsers]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [folderSearch, setFolderSearch] = useState("");
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [grantConfirmOpen, setGrantConfirmOpen] = useState(false);
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
  const hiddenFolders = selectedFolders.filter(
    (id) => !visibleFolders.find((f) => f.id === id),
  ).length;

  // Fetch selected user's permissions for Direct Access
  const { data: selectedUserPerms, isLoading: loadingUserPerms } = useUserPermissions(selectedUserId);
  const selectedUserExistingFolderIds = useMemo(
    () => selectedUserPerms?.permissions.map((p) => p.folderId) ?? [],
    [selectedUserPerms],
  );

  // Auto-select folders the user already has access to
  useEffect(() => {
    if (selectedUserId && selectedUserPerms) {
      setSelectedFolders(selectedUserExistingFolderIds);
    }
  }, [selectedUserId, selectedUserPerms]);

  const selectedUser = useMemo(
    () => (selectedUserId ? allUsers.find((u) => u.id === selectedUserId) ?? null : null),
    [selectedUserId, allUsers],
  );

  const foldersToGrant = selectedFolders.filter((id) => !selectedUserExistingFolderIds.includes(id));
  const foldersToRevoke = selectedUserExistingFolderIds.filter((id) => !selectedFolders.includes(id));

  const grant = async () => {
    if (!selectedUserId || foldersToGrant.length === 0) return;
    try {
      await bulkGrantMutation.mutateAsync({ userId: selectedUserId, folderIds: foldersToGrant });
      toast.success(`Access granted to ${selectedUser?.name} for ${foldersToGrant.length} folder(s)`);
      setSelectedUserId(null);
      setSelectedFolders([]);
      setGrantConfirmOpen(false);
    } catch (error) {
      console.log("Error : ", error)
    }
  };

  const revoke = async () => {
    if (!selectedUserId || foldersToRevoke.length === 0) return;
    try {
      await bulkRevokeMutation.mutateAsync({ userId: selectedUserId, folderIds: foldersToRevoke });
      toast.success(`Access revoked from ${selectedUser?.name} for ${foldersToRevoke.length} folder(s)`);
      setRevokeOpen(false);
      setSelectedUserId(null);
      setSelectedFolders([]);
    } catch (error) {
      console.log("Error ", error)
    }
  };

  const isGranting = bulkGrantMutation.isPending;
  const isRevoking = bulkRevokeMutation.isPending;
  
  const singleRevokeMutation = useRevokePermission();
  const { data: userPermissionsData, isLoading: loadingUserPermissions, refetch: refetchUserPermissions } = useUserPermissions(activeUserSearchId);

  const filteredUsersForTab = useMemo(() => {
    if (!userSearchQueryTab) return [];
    return employees.filter(u => 
      u.name.toLowerCase().includes(userSearchQueryTab.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQueryTab.toLowerCase())
    ).slice(0, 5);
  }, [employees, userSearchQueryTab]);

  const canGrant = !!selectedUserId && foldersToGrant.length > 0 && !isGranting;
  const canRevoke = !!selectedUserId && foldersToRevoke.length > 0 && !isRevoking;

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
              count={selectedUserId ? 1 : 0}
              hidden={0}
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
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {loadingUsers ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading users...</p>
                  </div>
                ) : visibleUsers.length > 0 ? (
                  visibleUsers.map((u) => {
                    const sel = selectedUserId === u.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() =>
                          setSelectedUserId(sel ? null : u.id)
                        }
                        className={cn(
                          "w-full flex items-center gap-3 p-2.5 rounded-lg border transition",
                          sel
                            ? "border-primary bg-accent"
                            : "border-transparent hover:bg-muted",
                        )}
                      >
                        <div className={cn(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                          sel ? "border-primary" : "border-muted-foreground/30"
                        )}>
                          {sel && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        </div>
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
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {loadingFolders ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading folders...</p>
                  </div>
                ) : !selectedUserId ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground">Select a user first</p>
                  </div>
                ) : loadingUserPerms ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground">Loading user's permissions...</p>
                  </div>
                ) : visibleFolders.length > 0 ? (
                  visibleFolders.map((f) => {
                    const sel = selectedFolders.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          setSelectedFolders((prev) =>
                            prev.includes(f.id)
                              ? prev.filter((id) => id !== f.id)
                              : [...prev, f.id]
                          );
                        }}
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

          {/* <Card>
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
          </Card> */}
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
                          return (
                            <Card key={perm.permissionId} className="group hover:border-primary/30 transition-colors">
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <FolderOpen className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium truncate">{perm?.folderName || "Unknown Folder"}</div>
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
                                          toast.success("Access removed successfully");
                                          refetchUserPermissions();
                                        },
                                        onError: () => {
                                          toast.error("Failed to remove access");
                                        }
                                      }
                                    );
                                  }}
                                >
                                  {singleRevokeMutation.isPending && 
                                   singleRevokeMutation.variables?.folderId === perm.folderId && 
                                   singleRevokeMutation.variables?.userId === activeUserSearchId ? (
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
            {selectedUserId ? (
              <>
                User: <strong>{selectedUser?.name}</strong> ·{" "}
                <strong>{selectedFolders.length}</strong> folders selected
                {foldersToGrant.length > 0 && (
                  <span className="text-green-600 ml-2">({foldersToGrant.length} to grant)</span>
                )}
                {foldersToRevoke.length > 0 && (
                  <span className="text-destructive ml-2">({foldersToRevoke.length} to revoke)</span>
                )}
              </>
            ) : (
              "Select a user to manage folder access"
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!canRevoke}
              onClick={() => setRevokeOpen(true)}
            >
              Revoke access
              {foldersToRevoke.length > 0 && ` (${foldersToRevoke.length})`}
            </Button>
            <Button disabled={!canGrant} onClick={() => setGrantConfirmOpen(true)} className="min-w-[120px]">
              Grant access
              {foldersToGrant.length > 0 && ` (${foldersToGrant.length})`}
            </Button>
          </div>
        </div>
      </div>

      {/* Grant confirmation modal */}
      <Dialog open={grantConfirmOpen} onOpenChange={setGrantConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Access</DialogTitle>
            <DialogDescription>
              Grant <strong>{selectedUser?.name}</strong> access to {foldersToGrant.length} folder(s)?
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm space-y-2 max-h-40 overflow-y-auto">
            {foldersToGrant.map((id) => {
              const f = allFolders.find((x) => x.id === id);
              return (
                <div key={id} className="flex items-center gap-2 p-1.5 rounded bg-muted/50">
                  <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                  <span>{f?.name ?? id}</span>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantConfirmOpen(false)} disabled={isGranting}>
              Cancel
            </Button>
            <Button onClick={grant} disabled={isGranting}>
              {isGranting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Granting...</>
              ) : (
                "Confirm grant"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation modal */}
      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Access</DialogTitle>
            <DialogDescription>
              Revoke <strong>{selectedUser?.name}</strong>'s access from {foldersToRevoke.length} folder(s)?
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm space-y-2 max-h-40 overflow-y-auto">
            {foldersToRevoke.map((id) => {
              const f = allFolders.find((x) => x.id === id);
              return (
                <div key={id} className="flex items-center gap-2 p-1.5 rounded bg-muted/50">
                  <FolderOpen className="h-4 w-4 text-destructive shrink-0" />
                  <span>{f?.name ?? id}</span>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeOpen(false)} disabled={isRevoking}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={revoke} disabled={isRevoking}>
              {isRevoking ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Revoking...</>
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



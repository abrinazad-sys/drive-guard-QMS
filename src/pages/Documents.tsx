import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, StatusBadge, FileIcon, UserAvatar, StatusPill } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FolderOpen, Search, Download, Eye, MoreVertical, ChevronRight, Loader2, Check, ArrowLeft, Trash2, X, Cloud } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFolders, useFolderContents, useGlobalSearch, downloadFile, logFileAccess } from "@/services/fileService";
import { useAdminUsers } from "@/services/userService";
import { useGrantPermission, useFolderPermissions, useRevokePermission, useUsersWithoutAccess } from "@/services/permissionService";
import { auditService } from "@/services/auditService";
import { RoleBadge, RoleSelect } from "@/components/RoleControls";
import { DEFAULT_ROLE, type DriveRole } from "@/lib/roles";
import type { FileDto, FolderDto } from "@/dto/FolderDto";
import type { DriveItem } from "@/dto/FolderDto";

export default function Documents() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [crumbs, setCrumbs] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'Home' }]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [accessPanelFolder, setAccessPanelFolder] = useState<FolderDto | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [previewFile, setPreviewFile] = useState<FileDto | null>(null);
  const [detailFile, setDetailFile] = useState<FileDto | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string | null>(null);
  const [grantPermissionFolder, setGrantPermissionFolder] = useState<FolderDto | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [grantStep, setGrantStep] = useState<1 | 2>(1);
  const [grantSelectedUser, setGrantSelectedUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [grantSelectedRole, setGrantSelectedRole] = useState<DriveRole>(DEFAULT_ROLE);
  const [revokingUserId, setRevokingUserId] = useState<number | null>(null);
  const [pendingPanelRevoke, setPendingPanelRevoke] = useState<{ userId: number; userName: string } | null>(null);

  const resetGrantModal = () => {
    setGrantPermissionFolder(null);
    setGrantStep(1);
    setGrantSelectedUser(null);
    setGrantSelectedRole(DEFAULT_ROLE);
    setUserSearchQuery("");
  };

  const { data: rootFolders = [], isLoading: loadingRoot } = useFolders();
  const { data: folderContents, isLoading: loadingContents } = useFolderContents(currentFolderId || "");
  // const { data: allUsers = [] } = useAdminUsers();
  const { data: usersWithoutAccess = [] } = useUsersWithoutAccess(grantPermissionFolder?.id || null, userSearchQuery);
  const grantPermissionMutation = useGrantPermission();
  const revokePermissionMutation = useRevokePermission();
  const { data: folderPermissions = [], isLoading: loadingPermissions, refetch: refetchPermissions } = useFolderPermissions(accessPanelFolder?.id || null);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const searchRef = useRef<HTMLDivElement>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const { data: globalResults = [], isLoading: searchingGlobal } = useGlobalSearch(debouncedSearch);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      if (search.trim().length >= 2) setShowSearchDropdown(true);
      else setShowSearchDropdown(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setShowSearchDropdown(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const foldersToDisplay = currentFolderId ? folderContents?.folders || [] : rootFolders;
  const filesToDisplay = currentFolderId ? folderContents?.files || [] : [];

  const filteredFolders = foldersToDisplay.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const filteredFiles = filesToDisplay.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || f.extension === filter)
  );

  // const filteredUsers = (grantPermissionFolder ? usersWithoutAccess : allUsers).filter(u =>
  //   u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
  //   u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  // );
  const filteredUsers = (usersWithoutAccess).filter(u =>
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const handleDownload = async (id: string, name: string) => {
    setDownloading(id);
    try {
      await downloadFile(id, name);
      setDownloaded(id);
      toast.success("File downloaded successfully");
      setTimeout(() => setDownloaded(null), 1500);
    } catch (error) {
      toast.error("Failed to download file");
    } finally {
      setDownloading(null);
    }
  };

  const handleGrantPermission = () => {
    if (!grantPermissionFolder || !grantSelectedUser) return;

    grantPermissionMutation.mutate(
      {
        folderId: grantPermissionFolder.id,
        userId: grantSelectedUser.id,
        role: grantSelectedRole,
      },
      {
        onSuccess: () => {
          toast.success("Permission granted successfully");
          resetGrantModal();
        },
        onError: () => {
        }
      },
    );
  };

  const isLoading = loadingRoot || (currentFolderId && loadingContents);

  return (
    <div className="relative h-full">
      <div className={`space-y-6 transition-opacity duration-200 ${accessPanelFolder ? "opacity-40" : "opacity-100"}`}>
        <PageHeader title="Documents" description="Browse folders and files synced from Google Drive." />

        <div className="flex flex-wrap items-center gap-1 text-sm">
          {crumbs.map((crumb, i) => (
            <div key={crumb.id ?? 'home'} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
              <button
                onClick={() => {
                  setCurrentFolderId(crumb.id);
                  setCrumbs(prev => prev.slice(0, i + 1));
                }}
                className={`${i === crumbs.length - 1 ? 'font-medium text-primary' : 'text-muted-foreground hover:text-foreground'} flex items-center gap-1 transition`}
              >
                {i === 0 && <FolderOpen className="h-4 w-4" />}
                {crumb.name}
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div ref={searchRef} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={currentFolderId ? "Search files/folders in this folder..." : "Search folders..."} className="pl-9" />
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-xl shadow-xl max-h-80 overflow-y-auto">
                {searchingGlobal ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : globalResults.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">No files found</div>
                ) : (
                  globalResults.map((item: DriveItem) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.type === "folder") return;
                        setSearch("");
                        setShowSearchDropdown(false);
                        logFileAccess(item.id, item.name, "preview");
                        setPreviewFile(item as FileDto);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent text-left transition border-b border-border last:border-0"
                    >
                      <FileIcon type={item.type === "folder" ? "folder" : (item as FileDto).extension} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.type === "folder" ? "Folder" : `${(item as FileDto).size} · ${new Date(item.modifiedAt).toLocaleDateString()}`}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {currentFolderId && (
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-44 select-none"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All file types</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="docx">Word</SelectItem>
                <SelectItem value="xlsx">Spreadsheet</SelectItem>
              </SelectContent>
            </Select>
          )}
          {currentFolderId && <Button variant="outline" onClick={() => {
            const parentId = folderContents?.parentId ?? null;
            setCurrentFolderId(parentId);
            setCrumbs(prev => parentId === null ? [{ id: null, name: 'Home' }] : prev.slice(0, -1));
          }}><ArrowLeft className="h-4 w-4 mr-2 select-none" />Back</Button>}
          {currentFolderId && isAdmin && (
            <Button
              variant="outline"
              onClick={() => {
                const current = foldersToDisplay.find(f => f.id === currentFolderId) || rootFolders.find(f => f.id === currentFolderId);
                if (current) setAccessPanelFolder(current);
                else setAccessPanelFolder({ id: currentFolderId, name: "Current Folder", type: "folder", modifiedAt: "", parentId: null });
              }}
              className="rounded-xl border-border hover:bg-accent hover:text-accent-foreground"
            >
              Manage Access
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-6">
            {filteredFolders.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredFolders.map(f => (
                  <div key={f.id} className="relative group">
                    <div
                      onClick={() => setSelectedId(selectedId === f.id ? null : f.id)}
                      onDoubleClick={() => {
                        setCurrentFolderId(f.id);
                        setCrumbs(prev => [...prev, { id: f.id, name: f.name }]);
                      }}
                      className={`p-4 rounded-xl border cursor-pointer select-none transition ${selectedId === f.id ? 'border-primary ring-2 ring-primary/30' : 'border-border bg-card hover:border-primary hover:bg-accent'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FolderOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="font-medium truncate group-hover:text-primary transition">{f.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">Folder · {new Date(f.modifiedAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="absolute top-2 right-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setGrantPermissionFolder(f)}>
                              Grant Permission
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAccessPanelFolder(f)}>
                              Manage Access
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {filteredFiles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredFiles.map(f => (
                  <Card
                    key={f.id}
                    className={`p-4 transition select-none cursor-pointer ${selectedId === f.id ? 'border-primary ring-2 ring-primary/30' : 'hover:border-primary'}`}
                    onClick={() => setSelectedId(selectedId === f.id ? null : f.id)}
                    onDoubleClick={() => { logFileAccess(f.id, f.name, "preview"); setPreviewFile(f); }}
                  >
                    <div className="flex items-start gap-3">
                      <FileIcon type={f.extension} />
                      <div className="flex-1 min-w-0">
                        <button onClick={(e) => { e.stopPropagation(); logFileAccess(f.id, f.name, "preview"); setPreviewFile(f); }} onDoubleClick={(e) => e.stopPropagation()} className="font-medium truncate text-left hover:text-primary block w-full">{f.name}</button>
                        <div className="text-xs text-muted-foreground mt-0.5">{f.size} · {new Date(f.modifiedAt).toLocaleDateString()}</div>
                        <div className="flex items-center gap-1 mt-3" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="outline" onClick={() => { logFileAccess(f.id, f.name, "preview"); setPreviewFile(f); }}><Eye className="h-3 w-3 mr-1" />Preview</Button>
                          <Button size="sm" variant="outline" onClick={() => handleDownload(f.id, f.name)} disabled={downloading === f.id}>
                            {downloading === f.id ? <Loader2 className="h-3 w-3 animate-spin" /> : downloaded === f.id ? <Check className="h-3 w-3 text-green-600" /> : <Download className="h-3 w-3" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDetailFile(f)}><MoreVertical className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {filteredFolders.length === 0 && filteredFiles.length === 0 && (
              <EmptyState title="Nothing here" description="This folder is empty or no items match your search." />
            )}
          </div>
        )}

        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-w-[100vw] w-full h-[100vh] flex flex-col p-4 overflow-hidden">
            <DialogHeader className="">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <DialogTitle className="text-xl">{previewFile?.name}</DialogTitle>
                  {/* <DialogDescription>Document Preview</DialogDescription> */}
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-border overflow-hidden relative flex items-center justify-center">
              {previewFile && (() => {
                const embedUrl = previewFile.webViewLink
                  .replace(/\/view(\?.*)?$/, "/preview")
                  .replace(/\/edit(\?.*)?$/, "/preview");

                if (previewFile.previewStrategy === "inline") {
                  return (
                    <iframe
                      key={previewFile.id}
                      src={embedUrl}
                      className="w-full h-full border-0"
                      title={previewFile.name}
                      allow="autoplay"
                    />
                  );
                }

                const isRedirect = previewFile.previewStrategy === "redirect";
                return (
                  <div className="text-center p-12">
                    <div className="h-20 w-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileIcon type={previewFile.extension} />
                    </div>
                    <h3 className="text-lg font-medium mb-1">
                      {isRedirect ? "Preview on Google Drive" : "No preview available"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                      {isRedirect
                        ? `This file type (${previewFile.extension.toUpperCase()}) can be previewed on Google Drive.`
                        : `This file type (${previewFile.extension.toUpperCase()}) cannot be previewed directly.`}
                    </p>
                    <Button variant="outline" onClick={() => { logFileAccess(previewFile.id, previewFile.name, "open_in_drive"); window.open(previewFile.webViewLink, "_blank"); }}>
                      Open in Google Drive
                    </Button>
                  </div>
                );
              })()}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 mt-3 pt-3 border-t border-border shrink-0">
              <Button variant="ghost" onClick={() => setPreviewFile(null)} className="rounded-xl">
                Close
              </Button>

              {previewFile && (
                <>
                  <Button
                    variant="outline"
                    className="rounded-xl border-border bg-background hover:bg-accent"
                    onClick={() => { logFileAccess(previewFile.id, previewFile.name, "open_in_drive"); window.open(previewFile.webViewLink, "_blank"); }}
                  >
                    <Cloud className="h-4 w-4 mr-2 text-primary" />
                    Open in Drive
                  </Button>

                  <Button
                    className="rounded-xl px-6"
                    onClick={() => handleDownload(previewFile.id, previewFile.name)}
                    disabled={downloading === previewFile.id}
                  >
                    {downloading === previewFile.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : downloaded === previewFile.id ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    {downloaded === previewFile.id ? "Downloaded" : "Download"}
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Sheet open={!!detailFile} onOpenChange={() => setDetailFile(null)}>
          <SheetContent>
            <SheetHeader><SheetTitle>File Details</SheetTitle></SheetHeader>
            {detailFile && (
              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-3"><FileIcon type={detailFile.extension} /><div><div className="font-semibold">{detailFile.name}</div><div className="text-xs text-muted-foreground">{detailFile.size}</div></div></div>
                <dl className="space-y-2 text-sm">
                  <Row k="Type" v={detailFile.extension.toUpperCase()} />
                  <Row k="Modified" v={new Date(detailFile.modifiedAt).toLocaleString()} />
                  <Row k="Preview" v={<Button variant="link" className="p-0 h-auto text-xs" onClick={() => { logFileAccess(detailFile.id, detailFile.name, "open_in_drive"); window.open(detailFile.webViewLink, "_blank"); }}>View on Drive</Button>} />
                </dl>
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={() => { logFileAccess(detailFile.id, detailFile.name, "preview"); setPreviewFile(detailFile); setDetailFile(null); }}><Eye className="h-4 w-4 mr-2" />Preview</Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => handleDownload(detailFile.id, detailFile.name)}
                    disabled={downloading === detailFile.id}
                  >
                    {downloading === detailFile.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : downloaded === detailFile.id ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    {downloaded === detailFile.id ? "Downloaded" : "Download"}
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {accessPanelFolder && (
        <div className="fixed top-0 right-0 w-[380px] h-full bg-background border-l border-border p-6 shadow-xl z-50 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-semibold text-foreground">Users with Access</h3>
              <p className="text-xs text-muted-foreground truncate max-w-[280px]">{accessPanelFolder.name}</p>
            </div>
            <button onClick={() => setAccessPanelFolder(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-0">
            {loadingPermissions ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading permissions...</p>
              </div>
            ) : folderPermissions.length > 0 ? (
              folderPermissions.map((perm, idx) => (
                <div key={perm.permissionId} className="flex items-center justify-between py-5 border-b border-border last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <UserAvatar name={perm.user.name} color="blue" size="large" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-foreground">{perm.user.name}</span>
                      <span className="text-xs text-muted-foreground">{perm.user.email}</span>
                      <div className="mt-2 flex items-center gap-2">
                        <StatusPill status={perm.user.isActive ? "active" : "disabled"} />
                        <RoleBadge role={perm.role} />
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        Granted by {perm.grantedBy} on {new Date(perm.grantedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!accessPanelFolder || perm.user.role === 'admin') return;
                      setPendingPanelRevoke({ userId: perm.user.id, userName: perm.user.name });
                    }}
                    disabled={revokingUserId === perm.user.id || perm.user.role === 'admin'}
                    className="text-muted-foreground hover:text-destructive p-2 rounded-lg transition-colors disabled:opacity-50"
                    title={perm.user.role === 'admin' ? "Admins cannot be removed" : "Remove access"}
                  >
                    {revokingUserId === perm.user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-20">
                <p className="text-sm text-muted-foreground">No users have direct access to this folder.</p>
              </div>
            )}
          </div>
        </div>
      )}
      <Dialog
        open={!!grantPermissionFolder}
        onOpenChange={(open) => {
          if (!open) resetGrantModal();
        }}
      >
        <DialogContent className="max-w-md">
          {grantStep === 1 ? (
            <>
              <DialogHeader>
                <DialogTitle>Grant Permission</DialogTitle>
                <DialogDescription>
                  Select a user to grant access to{" "}
                  <strong>{grantPermissionFolder?.name}</strong>.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="pl-9"
                    autoFocus
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition cursor-pointer text-left"
                        onClick={() => {
                          setGrantSelectedUser({ id: u.id, name: u.name, email: u.email });
                          setGrantSelectedRole(DEFAULT_ROLE);
                          setGrantStep(2);
                        }}
                      >
                        <UserAvatar name={u.name} email={u.email} />
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                      {userSearchQuery ? "No users found" : "Type to search users"}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={resetGrantModal}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Choose Role</DialogTitle>
                <DialogDescription>
                  Set the access level for <strong>{grantPermissionFolder?.name}</strong>.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                  <UserAvatar name={grantSelectedUser?.name ?? ""} email={grantSelectedUser?.email} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">Role</span>
                  <RoleSelect value={grantSelectedRole} onChange={setGrantSelectedRole} className="w-52" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setGrantStep(1)} disabled={grantPermissionMutation.isPending}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={resetGrantModal} disabled={grantPermissionMutation.isPending}>
                    Cancel
                  </Button>
                  <Button onClick={handleGrantPermission} disabled={grantPermissionMutation.isPending}>
                    {grantPermissionMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    Grant Permission
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingPanelRevoke} onOpenChange={(open) => { if (!open) setPendingPanelRevoke(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Access</DialogTitle>
            <DialogDescription>
              Remove <strong>{pendingPanelRevoke?.userName}</strong>'s access to{" "}
              <strong>{accessPanelFolder?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setPendingPanelRevoke(null)}
              disabled={revokePermissionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={revokePermissionMutation.isPending}
              onClick={() => {
                if (!accessPanelFolder || !pendingPanelRevoke) return;
                const target = pendingPanelRevoke;
                setRevokingUserId(target.userId);
                revokePermissionMutation.mutate(
                  { folderId: accessPanelFolder.id, userId: target.userId },
                  {
                    onSuccess: () => {
                      auditService.addLog({
                        actor: "Admin",
                        role: "admin",
                        action: "Revoked access",
                        target: target.userName,
                        folder: accessPanelFolder.name,
                        status: "active",
                      });
                      toast.success("Permission revoked successfully");
                      refetchPermissions();
                      setPendingPanelRevoke(null);
                    },
                    onError: () => {
                      auditService.addLog({
                        actor: "Admin",
                        role: "admin",
                        action: "Revoked access",
                        target: target.userName,
                        folder: accessPanelFolder.name,
                        status: "deactive",
                      });
                    },
                    onSettled: () => setRevokingUserId(null),
                  },
                );
              }}
            >
              {revokePermissionMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Removing...</>
              ) : (
                "Remove access"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-right">{v}</dd></div>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card><CardContent className="p-12 text-center">
      <div className="h-14 w-14 mx-auto rounded-full bg-muted flex items-center justify-center mb-3"><FolderOpen className="h-6 w-6 text-muted-foreground" /></div>
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{description}</div>
    </CardContent></Card>
  );
}

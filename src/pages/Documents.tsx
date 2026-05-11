import { useState } from "react";
import { PageHeader, StatusBadge, FileIcon, UserAvatar, StatusPill } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FolderOpen, Search, Download, Eye, MoreVertical, ChevronRight, Loader2, Check, ArrowLeft, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFolders, useFolderContents, downloadFile } from "@/services/fileService";
import type { FileDto, FolderDto } from "@/dto/FolderDto";

const usersWithAccess = [
  { name: "Sara Johnson", email: "sara.j@company.com", status: "synced" as const },
  { name: "Michael Chen", email: "m.chen@company.com", status: "synced" as const },
  { name: "Emma Wilson", email: "e.wilson@company.com", status: "pending" as const },
  { name: "David Lee", email: "d.lee@company.com", status: "synced" as const },
];

export default function Documents() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [previewFile, setPreviewFile] = useState<FileDto | null>(null);
  const [detailFile, setDetailFile] = useState<FileDto | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string | null>(null);

  const { data: rootFolders = [], isLoading: loadingRoot } = useFolders();
  const { data: folderContents, isLoading: loadingContents } = useFolderContents(currentFolderId || "");

  const foldersToDisplay = currentFolderId ? folderContents?.folders || [] : rootFolders;
  const filesToDisplay = currentFolderId ? folderContents?.files || [] : [];

  const filteredFolders = foldersToDisplay.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const filteredFiles = filesToDisplay.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || f.extension === filter)
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

  const isLoading = loadingRoot || (currentFolderId && loadingContents);

  return (
    <div className="relative h-full">
      <div className={`space-y-6 transition-opacity duration-200 ${isPanelOpen ? "opacity-40" : "opacity-100"}`}>
      <PageHeader title="Documents" description="Browse folders and files synced from Google Drive." />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button onClick={() => setCurrentFolderId(null)} className="text-muted-foreground hover:text-foreground flex items-center gap-1">
          <FolderOpen className="h-4 w-4" />Home
        </button>
        {currentFolderId && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-primary">Current Folder</span>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={currentFolderId ? "Search files/folders in this folder..." : "Search folders..."} className="pl-9" />
        </div>
        {currentFolderId && (
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All file types</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="docx">Word</SelectItem>
              <SelectItem value="xlsx">Spreadsheet</SelectItem>
            </SelectContent>
          </Select>
        )}
        {currentFolderId && <Button variant="outline" onClick={() => setCurrentFolderId(null)}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>}
        {currentFolderId && (
          <Button
            variant="outline"
            onClick={() => setIsPanelOpen(true)}
            className="rounded-xl border-border hover:bg-accent hover:text-accent-foreground"
          >
            Manage User
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
                <button key={f.id} onClick={() => setCurrentFolderId(f.id)} className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-accent transition group">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><FolderOpen className="h-5 w-5 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate group-hover:text-primary transition">{f.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">Folder · {new Date(f.modifiedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {filteredFiles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredFiles.map(f => (
                <Card key={f.id} className="p-4 hover:border-primary transition">
                  <div className="flex items-start gap-3">
                    <FileIcon type={f.extension} />
                    <div className="flex-1 min-w-0">
                      <button onClick={() => setDetailFile(f)} className="font-medium truncate text-left hover:text-primary block w-full">{f.name}</button>
                      <div className="text-xs text-muted-foreground mt-0.5">{f.size} · {new Date(f.modifiedAt).toLocaleDateString()}</div>
                      <div className="flex items-center gap-1 mt-3">
                        <Button size="sm" variant="outline" onClick={() => setPreviewFile(f)}><Eye className="h-3 w-3 mr-1" />Preview</Button>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
            <DialogDescription>Document Preview</DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border border-border">
            <div className="text-center">
              <FileIcon type={previewFile?.extension || "other"} />
              <div className="text-sm text-muted-foreground mt-3 font-medium">Preview available in Google Drive</div>
              <Button variant="link" className="mt-2" onClick={() => previewFile && window.open(previewFile.webViewLink, "_blank")}>Open in Drive</Button>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setPreviewFile(null)}>Close</Button>
            <Button onClick={() => previewFile && handleDownload(previewFile.id, previewFile.name)}><Download className="h-4 w-4 mr-2" />Download</Button>
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
                <Row k="Preview" v={<Button variant="link" className="p-0 h-auto text-xs" onClick={() => window.open(detailFile.webViewLink, "_blank")}>View on Drive</Button>} />
              </dl>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={() => { setPreviewFile(detailFile); setDetailFile(null); }}><Eye className="h-4 w-4 mr-2" />Preview</Button>
                <Button className="flex-1" variant="outline" onClick={() => handleDownload(detailFile.id, detailFile.name)}><Download className="h-4 w-4 mr-2" />Download</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      </div>

      {isPanelOpen && (
        <div className="fixed top-0 right-0 w-[380px] h-full bg-background border-l border-border p-6 shadow-xl z-50 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-semibold text-foreground">Users with Access</h3>
            <button onClick={() => setIsPanelOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-0">
            {usersWithAccess.map((mappedUser, idx) => (
              <div key={idx} className="flex items-center justify-between py-5 border-b border-border last:border-0">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <UserAvatar name={mappedUser.name} color="blue" size="large" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">{mappedUser.name}</span>
                    <span className="text-xs text-muted-foreground">{mappedUser.email}</span>
                    <div className="mt-2">
                      <StatusPill status={mappedUser.status} />
                    </div>
                  </div>
                </div>
                <button className="text-muted-foreground hover:text-destructive p-2 rounded-lg transition-colors" title="Remove access">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
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

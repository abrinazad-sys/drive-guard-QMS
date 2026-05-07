import { useState } from "react";
import { PageHeader, StatusBadge, FileIcon } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { folders, files } from "@/lib/mock-data";
import { FolderOpen, Search, Download, Eye, MoreVertical, ChevronRight, Loader2, Check, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Documents() {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [previewFile, setPreviewFile] = useState<typeof files[0] | null>(null);
  const [detailFile, setDetailFile] = useState<typeof files[0] | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string | null>(null);

  const folder = folders.find(f => f.id === currentFolder);
  const folderFiles = currentFolder ? files.filter(f => f.folder === folder?.name) : [];

  const filteredFolders = !currentFolder ? folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase())) : [];
  const filteredFiles = folderFiles.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || f.type === filter)
  );

  const handleDownload = (id: string) => {
    setDownloading(id);
    setTimeout(() => {
      setDownloading(null);
      setDownloaded(id);
      toast.success("File downloaded successfully");
      setTimeout(() => setDownloaded(null), 1500);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" description="Browse folders and files synced from Google Drive." />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button onClick={() => setCurrentFolder(null)} className="text-muted-foreground hover:text-foreground flex items-center gap-1">
          <FolderOpen className="h-4 w-4" />Home
        </button>
        {folder && (<><ChevronRight className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{folder.parent}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /><span className="font-medium text-primary">{folder.name}</span></>)}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={currentFolder ? "Search files in this folder..." : "Search folders..."} className="pl-9" />
        </div>
        {currentFolder && (
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
        {currentFolder && <Button variant="outline" onClick={() => setCurrentFolder(null)}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>}
      </div>

      {!currentFolder && (
        <>
          {filteredFolders.length === 0 ? (
            <EmptyState title="No folders found" description="Try a different search term." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredFolders.map(f => (
                <button key={f.id} onClick={() => setCurrentFolder(f.id)} className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-accent transition group">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary-soft flex items-center justify-center shrink-0"><FolderOpen className="h-5 w-5 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate group-hover:text-primary transition">{f.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{f.parent}</div>
                      <div className="text-xs text-muted-foreground mt-2">{f.itemCount} items · {f.modified}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {currentFolder && (
        <>
          {filteredFiles.length === 0 ? (
            <EmptyState title="This folder is empty" description="No files match your filters." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredFiles.map(f => (
                <Card key={f.id} className="p-4 hover:border-primary transition">
                  <div className="flex items-start gap-3">
                    <FileIcon type={f.type} />
                    <div className="flex-1 min-w-0">
                      <button onClick={() => setDetailFile(f)} className="font-medium truncate text-left hover:text-primary block w-full">{f.name}</button>
                      <div className="text-xs text-muted-foreground mt-0.5">{f.size} · {f.modified}</div>
                      <div className="flex items-center gap-1 mt-3">
                        <Button size="sm" variant="outline" onClick={() => setPreviewFile(f)}><Eye className="h-3 w-3 mr-1" />Preview</Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownload(f.id)} disabled={downloading === f.id}>
                          {downloading === f.id ? <Loader2 className="h-3 w-3 animate-spin" /> : downloaded === f.id ? <Check className="h-3 w-3 text-success" /> : <Download className="h-3 w-3" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDetailFile(f)}><MoreVertical className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
            <DialogDescription>Google Drive viewer preview</DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border border-border">
            <div className="text-center">
              <FileIcon type={previewFile?.type || "other"} />
              <div className="text-sm text-muted-foreground mt-3">Preview placeholder</div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setPreviewFile(null)}>Close</Button>
            <Button onClick={() => previewFile && handleDownload(previewFile.id)}><Download className="h-4 w-4 mr-2" />Download</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={!!detailFile} onOpenChange={() => setDetailFile(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>File Details</SheetTitle></SheetHeader>
          {detailFile && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center gap-3"><FileIcon type={detailFile.type} /><div><div className="font-semibold">{detailFile.name}</div><div className="text-xs text-muted-foreground">{detailFile.size}</div></div></div>
              <dl className="space-y-2 text-sm">
                <Row k="Type" v={detailFile.type.toUpperCase()} />
                <Row k="Folder" v={detailFile.folder} />
                <Row k="Modified" v={detailFile.modified} />
                <Row k="Owner" v={detailFile.owner} />
                <Row k="Sync" v={<StatusBadge status={detailFile.syncStatus} />} />
              </dl>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={() => { setPreviewFile(detailFile); setDetailFile(null); }}><Eye className="h-4 w-4 mr-2" />Preview</Button>
                <Button className="flex-1" variant="outline" onClick={() => handleDownload(detailFile.id)}><Download className="h-4 w-4 mr-2" />Download</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
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

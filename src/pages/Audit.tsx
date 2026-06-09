import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared";
import { useAuditLogs, type AuditLog } from "@/services/auditService";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, FileText, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { exportToPdf } from "@/utils/exportPdf";

export default function Audit() {
  const [search, setSearch] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("all");
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<(number | undefined)[]>([]);
  const [detail, setDetail] = useState<AuditLog | null>(null);

  const { data, isLoading, isError } = useAuditLogs({
    search: search || undefined,
    targetType: targetTypeFilter,
    cursor,
    limit: 15,
  });

  const logs = data?.logs || [];
  const nextCursor = data?.nextCursor;

  const handleNextPage = () => {
    if (nextCursor) {
      setCursorHistory([...cursorHistory, cursor]);
      setCursor(nextCursor);
    }
  };

  const handlePrevPage = () => {
    const prevHistory = [...cursorHistory];
    const prevCursor = prevHistory.pop();
    setCursor(prevCursor);
    setCursorHistory(prevHistory);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setCursor(undefined);
    setCursorHistory([]);
  };

  const handleFilterChange = (val: string) => {
    setTargetTypeFilter(val);
    setCursor(undefined);
    setCursorHistory([]);
  };

  // Unique target types for the filter dropdown
  // Ideally this would come from another API or be a fixed list
  const targetTypes = ["User", "FolderPermission"];
  const targetTypeLabels: Record<string, string> = {
    User: "User",
    FolderPermission: "Folder Permission",
  };
  const hideFolderCol = targetTypeFilter === "User";

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="Detailed history of every action across QMS." actions={
        <>
          <Button variant="outline" onClick={() => {
            if (logs.length === 0) { toast.error("No logs to export"); return; }
            const header = hideFolderCol ? "Time,Admin,Action,Target,IP" : "Time,Admin,Action,Target,Folder,IP";
            const csvRows = logs.map(a => {
              const base = [new Date(a.createdAt).toLocaleString(), a.adminName, a.action, a.targetName];
              if (!hideFolderCol) base.push(a.folderName || "");
              base.push(a.ipAddress);
              return base.map(v => `"${v}"`).join(",");
            });
            const blob = new Blob([header + "\n" + csvRows.join("\n")], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success("Audit logs exported as CSV");
          }}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
          <Button variant="outline" onClick={() => {
            if (logs.length === 0) { toast.error("No logs to export"); return; }
            exportToPdf({
              title: "Audit Logs",
              subtitle: `${logs.length} entries \u00b7 Generated ${new Date().toLocaleString()}`,
              columns: hideFolderCol ? ["Time", "Admin", "Action", "Target"] : ["Time", "Admin", "Action", "Target", "Folder"],
              rows: logs.map(a => {
                const row = [
                  new Date(a.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
                  a.adminName,
                  a.action,
                  a.targetName,
                ];
                if (!hideFolderCol) row.push(a.folderName || "-");
                return row;
              }),
              filename: `audit_logs_${new Date().toISOString().slice(0, 10)}.pdf`,
            });
            toast.success("Audit logs exported as PDF");
          }}><FileText className="h-4 w-4 mr-2" />Export PDF</Button>
        </>
      } />
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search logs by admin or target..." 
                value={search} 
                onChange={(e) => handleSearch(e.target.value)} 
                className="pl-9" 
              />
            </div>
            <Select value={targetTypeFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Target Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {targetTypes.map(t => <SelectItem key={t} value={t}>{targetTypeLabels[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Loading audit logs...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-destructive">
              Failed to load audit logs. Please try again.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    {!hideFolderCol && <TableHead>Folder</TableHead>}
                  </TableRow></TableHeader>
                  <TableBody>
                    {logs.map(a => (
                      <TableRow key={a.id} className="cursor-pointer" onClick={() => setDetail(a)}>
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                          {new Date(a.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{a.adminName}</TableCell>
                        <TableCell className="whitespace-nowrap">{a.action}</TableCell>
                        <TableCell className="whitespace-nowrap">{a.targetName}</TableCell>
                        {!hideFolderCol && <TableCell className="whitespace-nowrap">{a.folderName || "-"}</TableCell>}
                      </TableRow>
                    ))}
                    {logs.length === 0 && <TableRow><TableCell colSpan={hideFolderCol ? 4 : 5} className="text-center py-12 text-muted-foreground">No logs match your filters</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {logs.length} entries
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePrevPage} 
                    disabled={cursorHistory.length === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNextPage} 
                    disabled={!nextCursor}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!detail} onOpenChange={() => setDetail(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>Audit Detail</SheetTitle></SheetHeader>
          {detail && (
            <dl className="space-y-2 text-sm mt-6">
              <Row k="Timestamp" v={new Date(detail.createdAt).toLocaleString()} />
              <Row k="Admin" v={detail.adminName} />
              <Row k="Action" v={detail.action} />
              <Row k="Target Type" v={detail.targetType} />
              <Row k="Target Name" v={detail.targetName} />
              <Row k="Folder" v={detail.folderName || "-"} />
              <Row k="IP Address" v={detail.ipAddress} />
              <Row k="Browser" v={detail.userBrowser} />
              <Row k="OS" v={detail.userOS} />
            </dl>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-4 border-b border-border pb-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-right">{v}</dd></div>;
}


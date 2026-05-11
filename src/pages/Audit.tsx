import { useState, useEffect, useMemo } from "react";
import { PageHeader, StatusBadge } from "@/components/shared";
import { auditService, type AuditLog } from "@/services/auditService";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Audit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detail, setDetail] = useState<AuditLog | null>(null);

  useEffect(() => {
    setLogs(auditService.getLogs());
  }, []);

  const filtered = useMemo(() => logs.filter(a =>
    (a.actor.toLowerCase().includes(search.toLowerCase()) || 
     a.target.toLowerCase().includes(search.toLowerCase()) || 
     a.action.toLowerCase().includes(search.toLowerCase()) ||
     a.folder.toLowerCase().includes(search.toLowerCase())) &&
    (actionFilter === "all" || a.action === actionFilter) &&
    (statusFilter === "all" || a.status === statusFilter)
  ), [logs, search, actionFilter, statusFilter]);

  const actions = useMemo(() => Array.from(new Set(logs.map(a => a.action))), [logs]);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="Detailed history of every action across QMS." actions={
        <>
          <Button variant="outline" onClick={() => toast.success("Audit logs exported as CSV")}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
          <Button variant="outline" onClick={() => toast.success("Audit logs exported as PDF")}><FileText className="h-4 w-4 mr-2" />Export PDF</Button>
        </>
      } />
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All actions</SelectItem>{actions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="deactive">Deactive</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Time</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>By</TableHead><TableHead>Folder</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map(a => (
                  <TableRow key={a.id} className="cursor-pointer" onClick={() => setDetail(a)}>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {new Date(a.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{a.actor}</TableCell>
                    <TableCell className="whitespace-nowrap">{a.action}</TableCell>
                    <TableCell className="whitespace-nowrap">{a.target}</TableCell>
                    <TableCell className="whitespace-nowrap">{a.folder}</TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No logs match your filters</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!detail} onOpenChange={() => setDetail(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>Audit Detail</SheetTitle></SheetHeader>
          {detail && (
            <dl className="space-y-2 text-sm mt-6">
              <Row k="Timestamp" v={detail.time} />
              <Row k="Actor" v={detail.actor} />
              <Row k="Role" v={detail.role} />
              <Row k="Action" v={detail.action} />
              <Row k="Target" v={detail.target} />
              <Row k="Folder/File" v={detail.folder} />
              <Row k="IP Address" v={detail.ip} />
              <Row k="Status" v={<StatusBadge status={detail.status} />} />
              {detail.error && <Row k="Error" v={detail.error} />}
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

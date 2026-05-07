import { useState } from "react";
import { PageHeader, MetricCard, StatusBadge } from "@/components/shared";
import { syncRecords as initial } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, AlertTriangle, CheckCircle2, Clock, RefreshCw, Loader2, Cloud } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Sync() {
  const [records, setRecords] = useState(initial);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = records.filter(r =>
    r.item.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || r.status === filter)
  );

  const retry = (id: string) => {
    setRetrying(id);
    setTimeout(() => {
      setRecords(rs => rs.map(r => r.id === id ? { ...r, status: "synced", error: "—", lastAttempt: "Just now" } : r));
      setRetrying(null);
      toast.success("Sync retried successfully");
    }, 900);
  };
  const retryAll = () => {
    toast.success("Retrying all failed syncs...");
    setTimeout(() => {
      setRecords(rs => rs.map(r => r.status === "failed" ? { ...r, status: "synced", error: "—", lastAttempt: "Just now" } : r));
      toast.success("All failed syncs resolved");
    }, 1200);
  };

  const counts = {
    synced: records.filter(r => r.status === "synced").length,
    pending: records.filter(r => r.status === "pending").length,
    failed: records.filter(r => r.status === "failed").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Sync Health" description="Monitor Google Drive synchronisation status." actions={
        <Button onClick={retryAll}><RefreshCw className="h-4 w-4 mr-2" />Retry all failed</Button>
      } />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Connection" value="Connected" icon={<Cloud className="h-5 w-5" />} hint="examplecompany.com" variant="success" />
        <MetricCard label="Synced" value={counts.synced} icon={<CheckCircle2 className="h-5 w-5" />} variant="success" />
        <MetricCard label="Pending" value={counts.pending} icon={<Clock className="h-5 w-5" />} variant="warning" />
        <MetricCard label="Failed" value={counts.failed} icon={<AlertTriangle className="h-5 w-5" />} variant={counts.failed > 0 ? "danger" : "default"} />
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <Input placeholder="Search records..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="synced">Synced</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Item</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Error</TableHead><TableHead>Last attempt</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium whitespace-nowrap">{r.item}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.type}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{r.error}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{r.lastAttempt}</TableCell>
                    <TableCell>
                      {r.status !== "synced" && (
                        <Button size="sm" variant="outline" onClick={() => retry(r.id)} disabled={retrying === r.id}>
                          {retrying === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><RefreshCw className="h-3 w-3 mr-1" />Retry</>}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground"><Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />No sync records</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

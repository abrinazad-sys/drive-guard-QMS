import { useState } from "react";
import { PageHeader, StatusBadge } from "@/components/shared";
import { useAuditLogs } from "@/services/auditService";
import { useFileAccessLogs } from "@/services/fileService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight, Download, Eye } from "lucide-react";

type ActivityType = "activity" | "permissions";

export default function ActivityPage() {
  const [type, setType] = useState<ActivityType>("activity");

  const [fileCursor, setFileCursor] = useState<number | undefined>(undefined);
  const [fileCursorHistory, setFileCursorHistory] = useState<(number | undefined)[]>([]);

  const [auditCursor, setAuditCursor] = useState<number | undefined>(undefined);
  const [auditCursorHistory, setAuditCursorHistory] = useState<(number | undefined)[]>([]);

  const limit = 10;

  const isFileMode = type === "activity";

  const { data: fileData, isLoading: loadingFile } = useFileAccessLogs({
    cursor: isFileMode ? fileCursor : undefined,
    limit: limit,
  });

  const { data: auditData, isLoading: loadingAudit } = useAuditLogs(
    !isFileMode
      ? { cursor: auditCursor, limit, targetType: "ALL" }
      : {}
  );

  const fileLogs = isFileMode ? (fileData?.logs ?? []) : [];
  const fileNextCursor = fileData?.nextCursor;
  const auditLogs = !isFileMode ? (auditData?.logs ?? []) : [];
  const auditNextCursor = auditData?.nextCursor;

  const logs = isFileMode
    ? fileLogs.map((l: any) => ({ ...l, _kind: "file_access" as const }))
    : auditLogs.map((l: any) => ({ ...l, _kind: "permission" as const }));

  const isLoading = isFileMode ? loadingFile : loadingAudit;

  const nextCursor = isFileMode ? fileNextCursor : auditNextCursor;
  const cursorHistory = isFileMode ? fileCursorHistory : auditCursorHistory;
  const setCursor = isFileMode ? setFileCursor : setAuditCursor;
  const setHistory = isFileMode ? setFileCursorHistory : setAuditCursorHistory;

  const handleNextPage = () => {
    if (nextCursor) {
      setHistory((prev: any) => [...prev, isFileMode ? fileCursor : auditCursor]);
      setCursor(nextCursor);
    }
  };

  const handlePrevPage = () => {
    const prev = [...cursorHistory];
    const c: any = prev.pop();
    setCursor(c);
    setHistory(prev);
  };

  const handleTypeChange = (val: string) => {
    setType(val as ActivityType);
    setFileCursor(undefined);
    setFileCursorHistory([]);
    setAuditCursor(undefined);
    setAuditCursorHistory([]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Activity"
        description="View your file access and permission activity."
      />
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Activity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activity">File Activity</SelectItem>
                <SelectItem value="permissions">Permissions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Loading activity...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Action</TableHead>
                      {!isFileMode && <TableHead>Action By</TableHead>}
                      {!isFileMode && <TableHead>FolderName</TableHead>}
                      {isFileMode && <TableHead>Details</TableHead>}
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((entry: any) => (
                      <TableRow key={entry._kind === "file_access" ? `f-${entry.id}` : `a-${entry.id}`}>
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString([], {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {entry._kind === "file_access" ? (
                            <span className="flex items-center gap-1">
                              {entry.action === "download" ? (
                                <Download className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                              {entry.action === "download" ? "Downloaded" : "Previewed"}
                            </span>
                          ) : (
                            entry.action
                          )}
                        </TableCell>
                        {!isFileMode && (
                          <TableCell className="whitespace-nowrap">
                            {entry.adminName}
                          </TableCell>
                        )}
                        {!isFileMode && (
                          <TableCell className="whitespace-nowrap">
                            {entry.folderName}
                          </TableCell>
                        )}
                        {isFileMode && (
                          <TableCell className="whitespace-nowrap">
                            {entry.fileName}
                          </TableCell>
                        )}
                        <TableCell>
                          <StatusBadge status="active" />
                        </TableCell>
                      </TableRow>
                    ))}
                    {logs.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={isFileMode ? 4 : 5}
                          className="text-center py-12 text-muted-foreground"
                        >
                          No activity found.
                        </TableCell>
                      </TableRow>
                    )}
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
    </div>
  );
}

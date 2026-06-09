import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSyncJob } from "@/contexts/SyncJobContext";
import { MetricCard, PageHeader, StatusBadge } from "@/components/shared";
import {
  Users,
  FolderOpen,
  Cloud,
  RefreshCw,
  ChevronRight,
  Loader2,
  Download,
  Eye
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuditLogs } from "@/services/auditService";
import { useFileAccessLogs } from "@/services/fileService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { useFolders, useFileAccessStats } from "@/services/fileService";
import { useDashboardStats } from "@/services/systemService";
import SyncNowButton from "@/components/SyncNowButton";

export default function Dashboard() {
  const { user } = useAuth();
  return user?.role === "admin" ? <AdminDashboard /> : <EmployeeDashboard />;
}

function AdminDashboard() {
  const nav = useNavigate();
  const {
    data: rootFolders = [],
    isLoading: loadingFolders,
    refetch: refetchFolders,
  } = useFolders();
  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const { data: accessStats, isLoading: loadingAccessStats } = useFileAccessStats();

  const { data: auditData, isLoading: loadingLogs } = useAuditLogs({
    limit: 6,
    targetType: 'FolderPermission',
  });
  const logs = auditData?.logs || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Overview of your QMS workspace and Drive integration."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Total Users"
          value={loadingStats ? "..." : stats?.users.total ?? "..."}
          icon={<Users className="h-5 w-5" />}
          hint="Registered accounts"
        />
        <MetricCard
          label="Active Users"
          value={loadingStats ? "..." : stats?.users.active ?? "..."}
          icon={<Users className="h-5 w-5" />}
          hint="Currently active"
          variant="success"
        />
        <MetricCard
          label="Total Folders"
          value={loadingStats ? "..." : stats?.folders.root ?? "..."}
          icon={<FolderOpen className="h-5 w-5" />}
          hint="Root-level folders"
        />
        <MetricCard
          label="Total Previews"
          value={loadingAccessStats ? "..." : accessStats?.totalPreviews ?? "..."}
          icon={<Eye className="h-5 w-5" />}
          hint="Last 7 days"
          variant="success"
        />
        <MetricCard
          label="Total Downloads"
          value={loadingAccessStats ? "..." : accessStats?.totalDownloads ?? "..."}
          icon={<Download className="h-5 w-5" />}
          hint="Last 7 days"
          variant="success"
        />

      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Permission Audits</CardTitle>
              <CardDescription>
                Latest access changes and admin activity
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => nav("/audit")}>
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loadingLogs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Folder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length > 0 ? (
                    logs.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                          {new Date(a.createdAt).toLocaleString([], {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {a.adminName}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {a.action}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {a.targetName}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {a.folderName || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No recent activity found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-primary" />
                Drive Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status="active" />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Workspace</span>
                <span className="font-medium">bedatasolutions.com</span>
              </div>
              {/* <div className="flex justify-between">
                <span className="text-muted-foreground">Last Sync</span>
                <span className="font-medium">Today, 10:30</span>
              </div> */}
              {/* <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => refetchFolders()}
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Refresh now
              </Button> */}
              <SyncNowButton variant="compact" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Folders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingFolders ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                rootFolders.slice(0, 4).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => nav("/documents")}
                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-accent transition text-left"
                  >
                    <FolderOpen className="h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {f.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        Department Folder
                      </div>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { data: rootFolders = [], isLoading: loadingFolders, refetch } = useFolders();
  const { isSyncing } = useSyncJob();
  const prevSyncing = useRef(isSyncing);
  const { data: accessStats, isLoading: loadingAccessStats } = useFileAccessStats();
  const { data: accessLogsData, isLoading: loadingAccessLogs } = useFileAccessLogs({
    limit: 5,
  });

  useEffect(() => {
    if (prevSyncing.current && !isSyncing) {
      refetch();
    }
    prevSyncing.current = isSyncing;
  }, [isSyncing, refetch]);
  const fileAccessLogs = accessLogsData?.logs ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Welcome back, {user?.name.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here are your assigned folders and recent activity.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Assigned Folders"
          value={loadingFolders ? "..." : rootFolders.length}
          icon={<FolderOpen className="h-5 w-5" />}
        />
        <MetricCard
          label="Recent Downloads"
          value={loadingAccessStats ? "..." : accessStats?.totalDownloads ?? "..."}
          icon={<Download className="h-5 w-5" />}
          hint="Last 7 days"
        />
        <MetricCard
          label="Recent Previews"
          value={loadingAccessStats ? "..." : accessStats?.totalPreviews ?? "..."}
          icon={<Eye className="h-5 w-5" />}
          hint="Last 7 days"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>My Folders</span>
            <SyncNowButton variant="compact" />
          </CardTitle>
          <CardDescription>Folders you have access to</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loadingFolders ? (
            <div className="flex justify-center py-10 col-span-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            rootFolders.map((f) => (
              <button
                key={f.id}
                onClick={() => nav("/documents")}
                className="text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-accent transition group"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate group-hover:text-primary transition">
                      {f.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Department Folder
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(f.modifiedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Activity</span>
            <Button variant="link" size="sm" onClick={() => nav("/my-activity")}>
              See all
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingAccessLogs ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : fileAccessLogs.length > 0 ? (
            fileAccessLogs.slice(0, 5).map((entry: any) => (
              <div
                key={entry.id}
                className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-3 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-700">
                    {entry.action === "download" ? (
                      <Download className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">
                      {entry.action === "download"
                        ? `Downloaded ${entry.fileName}`
                        : `Previewed ${entry.fileName}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </div>
                  <StatusBadge status="active" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground py-4 text-center">
              No recent activity recorded for your account.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

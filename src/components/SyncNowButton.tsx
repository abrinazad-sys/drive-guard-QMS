import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSyncJob } from "@/contexts/SyncJobContext";

interface Props {
  variant?: "default" | "compact";
}

export default function SyncNowButton({ variant = "default" }: Props) {
  const { startSync, isSyncing } = useSyncJob();

  if (variant === "compact") {
    return (
      <div className="space-y-2">
        {!isSyncing && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={startSync}
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Sync Permissions
          </Button>
        )}

        {isSyncing && (
          <Button variant="outline" size="sm" className="w-full mt-2" disabled>
            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
            Syncing...
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        onClick={startSync}
        disabled={isSyncing}
        className={cn(isSyncing && "border-primary/50")}
      >
        {isSyncing ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Syncing...</>
        ) : (
          <><RefreshCw className="h-4 w-4 mr-2" />Sync Now</>
        )}
      </Button>
    </div>
  );
}

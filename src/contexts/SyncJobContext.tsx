import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getSyncJobStatus, startPermissionSync } from "@/services/permissionService";
import { toast } from "sonner";

interface SyncJobState {
    jobId: string | null;
    status: "idle" | "pending";
    startSync: () => Promise<void>;
    isSyncing: boolean;
}

interface PersistedSyncJobState {
    jobId: string | null;
    status: "idle" | "pending";
}

const STORAGE_KEY = "qms-sync-job-state";
const SyncJobContext = createContext<SyncJobState | undefined>(undefined);

function readPersistedState(): PersistedSyncJobState {
    if (typeof window === "undefined") {
        return { jobId: null, status: "idle" };
    }

    try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return { jobId: null, status: "idle" };
        }

        const parsed = JSON.parse(raw) as PersistedSyncJobState;
        return {
            jobId: parsed.jobId ?? null,
            status: parsed.status === "pending" ? "pending" : "idle",
        };
    } catch {
        return { jobId: null, status: "idle" };
    }
}

function persistState(state: PersistedSyncJobState) {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearPersistedState() {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(STORAGE_KEY);
}

export function SyncJobProvider({ children }: { children: ReactNode }) {
    const persistedState = readPersistedState();
    const [jobId, setJobId] = useState<string | null>(persistedState.jobId);
    const [status, setStatus] = useState<"idle" | "pending">(persistedState.status);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const jobIdRef = useRef<string | null>(persistedState.jobId);
    const statusRef = useRef<"idle" | "pending">(persistedState.status);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const resetState = useCallback(() => {
        stopPolling();
        jobIdRef.current = null;
        statusRef.current = "idle";
        setJobId(null);
        setStatus("idle");
        clearPersistedState();
    }, [stopPolling]);

    const pollJobStatus = useCallback(async (activeJobId: string) => {
        try {
            const statusData = await getSyncJobStatus(activeJobId);

            if (statusData.status === "completed") {
                toast.success("Sync completed");
                resetState();
                return;
            }

            if (statusData.status === "failed") {
                toast.error(statusData.error ?? "Sync failed");
                resetState();
                return;
            }

            if (statusRef.current !== "pending") {
                statusRef.current = "pending";
                setStatus("pending");
                persistState({ jobId: activeJobId, status: "pending" });
            }
        } catch {
            toast.error("Failed to check sync status");
            resetState();
        }
    }, [resetState]);

    const startPolling = useCallback((activeJobId: string) => {
        stopPolling();
        void pollJobStatus(activeJobId);
        intervalRef.current = setInterval(() => {
            void pollJobStatus(activeJobId);
        }, 5000);
    }, [pollJobStatus, stopPolling]);

    useEffect(() => {
        jobIdRef.current = jobId;
        statusRef.current = status;
        persistState({ jobId, status });

        if (status === "pending" && jobId) {
            startPolling(jobId);
            return stopPolling;
        }

        stopPolling();
        return undefined;
    }, [jobId, startPolling, status, stopPolling]);

    const startSync = useCallback(async () => {
        if (statusRef.current === "pending") {
            return;
        }

        setJobId(null);
        setStatus("pending");
        jobIdRef.current = null;
        statusRef.current = "pending";
        persistState({ jobId: null, status: "pending" });

        try {
            const { jobId: nextJobId } = await startPermissionSync();
            jobIdRef.current = nextJobId;
            setJobId(nextJobId);
            setStatus("pending");
            statusRef.current = "pending";
            persistState({ jobId: nextJobId, status: "pending" });
        } catch (err: any) {
            const statusCode = err?.response?.status;
            if (statusCode === 409) {
                toast.error("A sync is already running. Please wait for it to complete.");
            } else {
                toast.error("Failed to start sync. Please try again.");
            }
            resetState();
        }
    }, [resetState, startPolling]);

    const value = useMemo<SyncJobState>(
        () => ({
            jobId,
            status,
            startSync,
            isSyncing: status === "pending",
        }),
        [jobId, startSync, status]
    );

    useEffect(() => () => stopPolling(), [stopPolling]);

    return <SyncJobContext.Provider value={value}>{children}</SyncJobContext.Provider>;
}

export function useSyncJob() {
    const context = useContext(SyncJobContext);
    if (!context) {
        throw new Error("useSyncJob must be used within a SyncJobProvider");
    }
    return context;
}

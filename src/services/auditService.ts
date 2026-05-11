export interface AuditLog {
  id: string;
  time: string; // ISO string
  actor: string;
  role: string;
  action: string;
  target: string;
  folder: string;
  status: "active" | "deactive";
  ip: string;
  error?: string;
}

const STORAGE_KEY = "qms_audit_logs";
const MAX_DAYS = 7;

class AuditService {
  private logs: AuditLog[] = [];

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.logs = JSON.parse(stored);
      } catch (e) {
        this.logs = [];
      }
    } else {
      this.logs = [];
    }
    this.cleanup();
  }

  private saveLogs() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
  }

  private cleanup() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - MAX_DAYS);
    
    const initialCount = this.logs.length;
    this.logs = this.logs.filter(log => new Date(log.time) > cutoff);
    
    if (this.logs.length !== initialCount) {
      this.saveLogs();
    }
  }

  getLogs(): AuditLog[] {
    this.cleanup();
    return [...this.logs].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }

  addLog(logData: Omit<AuditLog, "id" | "time" | "ip">) {
    const newLog: AuditLog = {
      ...logData,
      id: `a${Date.now()}`,
      time: new Date().toISOString(),
      ip: "127.0.0.1", // In a real app, this would come from the server response or headers
    };

    this.logs.unshift(newLog);
    this.cleanup();
    this.saveLogs();
  }
}

export const auditService = new AuditService();

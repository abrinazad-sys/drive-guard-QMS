import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  icon: ReactNode;
  hint?: string;
  variant?: "default" | "warning" | "success" | "danger";
}

export function MetricCard({ label, value, icon, hint, variant = "default" }: Props) {
  const variantClasses = {
    default: "bg-card",
    warning: "bg-warning/10 border-warning/30",
    success: "bg-success/10 border-success/30",
    danger: "bg-destructive/10 border-destructive/30",
  };
  const iconClasses = {
    default: "bg-primary-soft text-primary",
    warning: "bg-warning/20 text-warning",
    success: "bg-success/20 text-success",
    danger: "bg-destructive/20 text-destructive",
  };
  return (
    <Card className={cn("p-5 border", variantClasses[variant])}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", iconClasses[variant])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    synced: "bg-success/15 text-success border-success/30",
    success: "bg-success/15 text-success border-success/30",
    pending: "bg-warning/15 text-warning border-warning/30",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
    active: "bg-success/15 text-success border-success/30",
    inactive: "bg-muted text-muted-foreground border-border",
  };
  const cls = map[status.toLowerCase()] || "bg-muted text-muted-foreground border-border";
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize", cls)}>{status}</span>;
}

import { FileText, FileSpreadsheet, Image, Presentation, File } from "lucide-react";
export function FileIcon({ type }: { type: string }) {
  const map: Record<string, { icon: typeof FileText; color: string }> = {
    pdf: { icon: FileText, color: "text-red-500 bg-red-500/10" },
    docx: { icon: FileText, color: "text-blue-500 bg-blue-500/10" },
    xlsx: { icon: FileSpreadsheet, color: "text-green-500 bg-green-500/10" },
    image: { icon: Image, color: "text-purple-500 bg-purple-500/10" },
    pptx: { icon: Presentation, color: "text-orange-500 bg-orange-500/10" },
    other: { icon: File, color: "text-muted-foreground bg-muted" },
  };
  const { icon: Icon, color } = map[type] || map.other;
  return <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", color)}><Icon className="h-4 w-4" /></div>;
}

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DRIVE_ROLES, GRANTABLE_ROLE_OPTIONS, ROLE_UI_LABEL, roleLabel, type DriveRole } from "@/lib/roles";

const ROLE_BADGE_STYLE: Record<DriveRole, string> = {
  reader: "bg-secondary text-secondary-foreground border-secondary",
  commenter: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  writer: "bg-success/15 text-success border-success/30",
  fileOrganizer: "bg-warning/15 text-warning border-warning/30",
  organizer: "bg-primary/15 text-primary border-primary/30",
};

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const key = (DRIVE_ROLES as readonly string[]).includes(role) ? (role as DriveRole) : "reader";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap",
        ROLE_BADGE_STYLE[key],
        className,
      )}
    >
      {ROLE_UI_LABEL[key]}
    </span>
  );
}

export function RoleSelect({
  value,
  onChange,
  disabled,
  className,
}: {
  value: DriveRole;
  onChange: (role: DriveRole) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DriveRole)} disabled={disabled}>
      <SelectTrigger className={cn("h-8 w-40 text-xs", className)} onClick={(e) => e.stopPropagation()}>
        <SelectValue>{roleLabel(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {GRANTABLE_ROLE_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            <div className="flex flex-col">
              <span className="text-sm">{opt.label}</span>
              <span className="text-[10px] text-muted-foreground">{opt.description}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
}

const rules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "1 uppercase letter (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "1 lowercase letter (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "1 digit (0-9)", test: (p: string) => /[0-9]/.test(p) },
  { label: "1 special character (!@#$% etc.)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  return (
    <div className="space-y-1 mt-2">
      {rules.map((rule) => {
        const met = rule.test(password);
        return (
          <div key={rule.label} className="flex items-center gap-2 text-xs">
            {met ? (
              <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 text-destructive shrink-0" />
            )}
            <span
              className={cn(
                met ? "text-green-600 dark:text-green-400" : "text-muted-foreground",
              )}
            >
              {rule.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

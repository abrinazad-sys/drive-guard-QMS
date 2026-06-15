import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { fetchMentionableUsers, type ChatMention, type MentionableUser } from "@/services/chatService";
import { cn } from "@/lib/utils";

export interface MentionDraft {
  id: number;
  name: string;
  email: string;
  profilePhotoUrl?: string | null;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// Convert stored @[id] tokens back to @email so they're human-readable while editing.
export function hydrateMentions(content: string, mentions: { id: number; email: string }[]): string {
  const byId = new Map(mentions.map((m) => [m.id, m.email]));
  return content.replace(/@\[(\d+)\]/g, (_full, id) => {
    const email = byId.get(Number(id));
    return email ? `@${email}` : "@unknown";
  });
}

const MENTION_AT = /(^|\s)@(\S*)$/;

export function MentionInput({
  variant,
  initialText = "",
  initialMentions = [],
  placeholder,
  autoFocus,
  onSubmit,
  onCancel,
  onTypingChange,
}: {
  variant: "composer" | "edit";
  initialText?: string;
  initialMentions?: MentionDraft[];
  placeholder?: string;
  autoFocus?: boolean;
  onSubmit: (content: string, mentions: ChatMention[]) => void;
  onCancel?: () => void;
  onTypingChange?: (typing: boolean) => void;
}) {
  const [text, setText] = useState(initialText);
  const [pending, setPending] = useState<MentionDraft[]>(initialMentions);
  const [query, setQuery] = useState<string | null>(null);
  const [results, setResults] = useState<MentionableUser[]>([]);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) {
      const el = ref.current;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    }
  }, [autoFocus]);

  // Debounced autocomplete search.
  useEffect(() => {
    if (query == null) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetchMentionableUsers(query)
        .then((r) => { setResults(r); setActive(0); })
        .catch(() => setResults([]));
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  const detect = (value: string) => {
    const caret = ref.current?.selectionStart ?? value.length;
    const match = MENTION_AT.exec(value.slice(0, caret));
    setQuery(match ? match[2] : null);
  };

  const handleChange = (value: string) => {
    setText(value);
    detect(value);
    onTypingChange?.(true);
  };

  const pick = (u: MentionableUser) => {
    const el = ref.current;
    const caret = el?.selectionStart ?? text.length;
    const match = MENTION_AT.exec(text.slice(0, caret));
    if (!match) return;
    const start = match.index + match[1].length; // position of '@'
    const next = `${text.slice(0, start)}@${u.email} ${text.slice(caret)}`;
    setText(next);
    setPending((prev) => (prev.some((p) => p.id === u.id) ? prev : [...prev, u]));
    setQuery(null);
    setTimeout(() => el?.focus(), 0);
  };

  const serialize = (): { content: string; mentions: ChatMention[] } => {
    let content = text.trim();
    const mentions: ChatMention[] = [];
    // Longest email first so one email isn't a prefix-substring of another.
    const sorted = [...pending].sort((a, b) => b.email.length - a.email.length);
    for (const u of sorted) {
      const needle = `@${u.email}`;
      if (content.includes(needle)) {
        content = content.split(needle).join(`@[${u.id}]`);
        mentions.push({ id: u.id, name: u.name, email: u.email });
      }
    }
    return { content, mentions };
  };

  const submit = () => {
    if (!text.trim()) return;
    const { content, mentions } = serialize();
    onSubmit(content, mentions);
    if (variant === "composer") {
      setText("");
      setPending([]);
      setQuery(null);
    }
    onTypingChange?.(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const open = query != null && results.length > 0;
    if (open) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % results.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (i - 1 + results.length) % results.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pick(results[active]); return; }
      if (e.key === "Escape") { e.preventDefault(); setQuery(null); return; }
    } else {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); return; }
      if (e.key === "Escape" && onCancel) { e.preventDefault(); onCancel(); return; }
    }
  };

  return (
    <div className="relative">
      {query != null && results.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto z-20">
          {results.map((u, i) => (
            <button
              key={u.id}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(u)}
              className={cn("w-full flex items-center gap-2 p-2 text-left transition", i === active ? "bg-accent" : "hover:bg-accent")}
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={u.profilePhotoUrl || undefined} alt={u.name} />
                <AvatarFallback className="bg-primary-soft text-primary text-[10px]">{initials(u.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{u.name}</div>
                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {variant === "composer" ? (
        <div className="flex items-end gap-2">
          <Textarea
            ref={ref}
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button size="icon" onClick={submit} disabled={!text.trim()} className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-1">
          <Textarea
            ref={ref}
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={onKeyDown}
            className="min-h-[40px] text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-7" onClick={submit}>Save</Button>
            <Button size="sm" variant="ghost" className="h-7" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Send, Loader2, MoreVertical, Pencil, Trash2, X, MessageSquare, Check } from "lucide-react";
import { fetchMentionableUsers, type ChatMention, type MentionableUser } from "@/services/chatService";
import { useFileChat, type LocalMessage } from "@/hooks/useFileChat";
import { cn } from "@/lib/utils";

interface CurrentUser {
  id: number;
  name: string;
  email: string;
  profilePhotoUrl: string | null;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// content carries @[userId] tokens → render the mentioned user's email, highlighted.
function renderContent(content: string, mentions: ChatMention[]) {
  const byId = new Map(mentions.map((m) => [m.id, m]));
  const nodes: React.ReactNode[] = [];
  const re = /@\[(\d+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) nodes.push(<span key={key++}>{content.slice(last, m.index)}</span>);
    const u = byId.get(Number(m[1]));
    nodes.push(
      <span key={key++} className="text-primary bg-primary/10 rounded px-1 font-medium">
        @{u ? u.email : "unknown"}
      </span>,
    );
    last = re.lastIndex;
  }
  if (last < content.length) nodes.push(<span key={key++}>{content.slice(last)}</span>);
  return nodes;
}

export function FileChatPanel({
  file,
  onClose,
  currentUser,
}: {
  file: { id: string; name: string } | null;
  onClose: () => void;
  currentUser: CurrentUser;
}) {
  const open = !!file;
  const chat = useFileChat(file?.id ?? null, open, currentUser);

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef<number>(0);
  const restoreScrollRef = useRef(false);
  const atBottomRef = useRef(true);

  const [text, setText] = useState("");
  const [pendingMentions, setPendingMentions] = useState<MentionableUser[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<MentionableUser[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset composer when switching files.
  useEffect(() => {
    setText("");
    setPendingMentions([]);
    setMentionQuery(null);
    setEditingId(null);
  }, [file?.id]);

  // Mention autocomplete search (debounced).
  useEffect(() => {
    if (mentionQuery == null) return;
    const t = setTimeout(() => {
      fetchMentionableUsers(mentionQuery).then(setMentionResults).catch(() => setMentionResults([]));
    }, 180);
    return () => clearTimeout(t);
  }, [mentionQuery]);

  // Preserve scroll position when older messages are prepended; otherwise stick to bottom.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (restoreScrollRef.current) {
      el.scrollTop = el.scrollHeight - prevHeightRef.current;
      restoreScrollRef.current = false;
    } else if (atBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [chat.messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (el.scrollTop < 60 && chat.hasMore && !chat.loadingOlder) {
      prevHeightRef.current = el.scrollHeight;
      restoreScrollRef.current = true;
      chat.loadOlder();
    }
  };

  const handleInput = (value: string) => {
    setText(value);
    chat.setTyping(true);
    const caret = textareaRef.current?.selectionStart ?? value.length;
    const upto = value.slice(0, caret);
    const match = /(^|\s)@(\S*)$/.exec(upto);
    setMentionQuery(match ? match[2] : null);
  };

  const pickMention = (u: MentionableUser) => {
    const el = textareaRef.current;
    const caret = el?.selectionStart ?? text.length;
    const upto = text.slice(0, caret);
    const match = /(^|\s)@(\S*)$/.exec(upto);
    if (!match) return;
    const start = match.index + match[1].length; // position of '@'
    const before = text.slice(0, start);
    const after = text.slice(caret);
    const next = `${before}@${u.email} ${after}`;
    setText(next);
    setPendingMentions((prev) => (prev.some((p) => p.id === u.id) ? prev : [...prev, u]));
    setMentionQuery(null);
    setTimeout(() => el?.focus(), 0);
  };

  const serialize = (raw: string): { content: string; mentions: ChatMention[] } => {
    let content = raw.trim();
    const mentions: ChatMention[] = [];
    const sorted = [...pendingMentions].sort((a, b) => b.email.length - a.email.length);
    for (const u of sorted) {
      const needle = `@${u.email}`;
      if (content.includes(needle)) {
        content = content.split(needle).join(`@[${u.id}]`);
        mentions.push({ id: u.id, name: u.name, email: u.email });
      }
    }
    return { content, mentions };
  };

  const send = () => {
    if (!text.trim()) return;
    const { content, mentions } = serialize(text);
    chat.sendMessage(content, mentions);
    setText("");
    setPendingMentions([]);
    setMentionQuery(null);
    atBottomRef.current = true;
    chat.setTyping(false);
  };

  const saveEdit = (id: number) => {
    const { content } = serialize(editText);
    if (content.trim()) chat.editMessage(id, content);
    setEditingId(null);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col gap-0 [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{file?.name}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {chat.presence.length > 0 ? `${chat.presence.length} viewing` : "Chat"}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex -space-x-2 mr-1">
              {chat.presence.slice(0, 3).map((p) => (
                <Avatar key={p.id} className="h-6 w-6 border border-background">
                  <AvatarImage src={p.profilePhotoUrl || undefined} alt={p.name} />
                  <AvatarFallback className="bg-primary-soft text-primary text-[9px]">{initials(p.name)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto p-4 space-y-3">
          {chat.loadingOlder && (
            <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          )}
          {chat.loadingInitial ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Loading messages…</span>
            </div>
          ) : chat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <MessageSquare className="h-8 w-8 opacity-30" />
              <span className="text-sm">No messages yet. Say hi 👋</span>
            </div>
          ) : (
            chat.messages.map((m) => (
              <MessageRow
                key={m.tempId ?? m.id}
                m={m}
                isOwn={m.author.id === currentUser.id}
                seen={m.id > 0 && m.author.id === currentUser.id && chat.lastSeenByOthers >= m.id}
                editing={editingId === m.id}
                editText={editText}
                setEditText={setEditText}
                onStartEdit={() => { setEditingId(m.id); setEditText(m.content ?? ""); }}
                onSaveEdit={() => saveEdit(m.id)}
                onCancelEdit={() => setEditingId(null)}
                onDelete={() => chat.deleteMessage(m.id)}
              />
            ))
          )}
        </div>

        {/* Typing */}
        {chat.typingUsers.length > 0 && (
          <div className="px-4 py-1 text-xs text-muted-foreground italic">
            {chat.typingUsers.map((u) => u.email).join(", ")} {chat.typingUsers.length === 1 ? "is" : "are"} typing…
          </div>
        )}

        {/* Composer */}
        <div className="relative border-t border-border p-3">
          {mentionQuery != null && mentionResults.length > 0 && (
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-popover border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto z-10">
              {mentionResults.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => pickMention(u)}
                  className="w-full flex items-center gap-2 p-2 hover:bg-accent text-left"
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
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && mentionQuery == null) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Message…  (use @ to mention)"
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
            <Button size="icon" onClick={send} disabled={!text.trim()} className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MessageRow({
  m, isOwn, seen, editing, editText, setEditText, onStartEdit, onSaveEdit, onCancelEdit, onDelete,
}: {
  m: LocalMessage;
  isOwn: boolean;
  seen: boolean;
  editing: boolean;
  editText: string;
  setEditText: (v: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  const time = new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="group flex gap-2.5">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={m.author.profilePhotoUrl || undefined} alt={m.author.name} />
        <AvatarFallback className="bg-primary-soft text-primary text-[10px]">{initials(m.author.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {/* Header shows email (names can change) */}
          <span className="text-xs font-semibold truncate">{m.author.email}</span>
          <span className="text-[10px] text-muted-foreground shrink-0">{time}</span>
          {m.edited && !m.deleted && <span className="text-[10px] text-muted-foreground">(edited)</span>}
          {isOwn && !m.deleted && !m.pending && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition">
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onStartEdit}><Pencil className="h-3.5 w-3.5 mr-2" />Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" />Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {editing ? (
          <div className="mt-1 space-y-1">
            <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-[40px] text-sm" rows={2} />
            <div className="flex gap-2">
              <Button size="sm" className="h-7" onClick={onSaveEdit}>Save</Button>
              <Button size="sm" variant="ghost" className="h-7" onClick={onCancelEdit}>Cancel</Button>
            </div>
          </div>
        ) : m.deleted ? (
          <div className="text-sm text-muted-foreground italic mt-0.5">This message was deleted</div>
        ) : (
          <div className={cn("text-sm mt-0.5 whitespace-pre-wrap break-words", m.pending && "opacity-60", m.failed && "text-destructive")}>
            {renderContent(m.content ?? "", m.mentions)}
            {m.failed && <span className="text-[10px] ml-2">(failed to send)</span>}
          </div>
        )}

        {isOwn && seen && !m.deleted && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5"><Check className="h-3 w-3" />Seen</div>
        )}
      </div>
    </div>
  );
}

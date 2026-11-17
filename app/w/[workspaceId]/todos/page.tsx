"use client";

// 할 일 화면: 추가(제목·담당자·마감일), 완료 체크, 담당자 바꾸기, 삭제.
// 담당자는 멤버 목록에서 골라요.

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "cn";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ErrorText, Input, Select } from "@/components/ui/field";
import { shortDate } from "@/components/ui/format";
import { DueBadge } from "@/components/workspace/UpcomingPanel";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";
import type { Todo } from "@/lib/api";

const TABS = [
  { key: "todo", label: "할 일" },
  { key: "mine", label: "내 담당" },
  { key: "done", label: "완료" },
  { key: "all", label: "전체" },
] as const;

export default function TodosPage() {
  const ws = useWorkspace();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("todo");
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [due, setDue] = useState("");
  const [error, setError] = useState("");

  const filtered = ws.todos.filter((t) =>
    tab === "todo" ? !t.done : tab === "done" ? t.done : tab === "mine" ? t.assignee_id === ws.me?.id : true,
  );
  // 마감일 가까운 순, 마감일 없는 건 뒤로
  const sorted = [...filtered].sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") || a.id - b.id);
  const doneCount = ws.todos.filter((t) => t.done).length;
  const pct = ws.todos.length ? Math.round((doneCount / ws.todos.length) * 100) : 0;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const err = await ws.createTodo({ title: title.trim(), assignee_id: assignee ? Number(assignee) : null, due_date: due || null });
    if (err) return setError(err);
    setTitle("");
    setDue("");
    setError("");
  };

  const run = async (p: Promise<string | null>) => {
    const err = await p;
    setError(err ?? "");
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 overflow-y-auto p-4 md:p-6">
      <header>
        <h1 className="text-2xl">✅ 할 일</h1>
        <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-chart-2 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span>{doneCount}/{ws.todos.length} 완료 · {pct}%</span>
        </div>
      </header>

      <form onSubmit={add} className="flex flex-col gap-2 rounded-3xl border bg-card p-3 shadow-sm sm:flex-row">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="새 할 일 (예: 발표 자료 초안)" className="sm:flex-1" />
        <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="sm:w-32" aria-label="담당자">
          <option value="">담당자 없음</option>
          {ws.members.map((m) => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}
        </Select>
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="sm:w-40" aria-label="마감일" />
        <Button type="submit" className="h-auto rounded-xl py-2"><Plus /> 추가</Button>
      </form>
      <ErrorText>{error}</ErrorText>

      <div className="flex gap-1 rounded-2xl bg-muted p-1 text-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn("flex-1 rounded-xl py-1.5 transition", tab === t.key ? "bg-card font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-3xl border border-dashed p-10 text-center text-muted-foreground">
          {tab === "done" ? "아직 끝낸 일이 없어요. 화이팅! 💪" : "할 일이 없어요 🎉"}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((t) => (
            <TodoRow key={t.id} todo={t} onChange={(patch) => run(ws.updateTodo(t.id, patch))} onDelete={() => run(ws.deleteTodo(t.id))} />
          ))}
        </ul>
      )}
    </main>
  );
}

function TodoRow({ todo: t, onChange, onDelete }: {
  todo: Todo;
  onChange: (patch: Partial<Todo>) => void;
  onDelete: () => void;
}) {
  const ws = useWorkspace();
  const who = ws.members.find((m) => m.user_id === t.assignee_id);
  return (
    <li className={cn("animate-pop group flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 transition", t.done && "bg-muted/50")}>
      <input
        type="checkbox"
        checked={t.done}
        onChange={() => onChange({ done: !t.done })}
        className="size-5 shrink-0 cursor-pointer accent-primary"
        aria-label={`${t.title} 완료`}
      />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate", t.done && "text-muted-foreground line-through")}>{t.title}</p>
        {t.due_date && <p className="text-xs text-muted-foreground">마감 {shortDate(t.due_date)}</p>}
      </div>
      {t.due_date && !t.done && <DueBadge date={t.due_date} />}
      <label className="flex items-center gap-1.5" title="담당자 바꾸기">
        {who ? <Avatar id={who.user_id} name={who.name} className="size-7 text-xs" /> : <span className="size-7 rounded-full border border-dashed" />}
        <select
          value={t.assignee_id ?? ""}
          onChange={(e) => onChange({ assignee_id: e.target.value ? Number(e.target.value) : null })}
          className="max-w-20 cursor-pointer bg-transparent text-sm outline-none"
          aria-label="담당자"
        >
          <option value="">없음</option>
          {ws.members.map((m) => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}
        </select>
      </label>
      <button
        onClick={() => confirm(`"${t.title}"을(를) 지울까요?`) && onDelete()}
        aria-label="삭제"
        className="rounded-lg p-1.5 text-muted-foreground opacity-60 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}

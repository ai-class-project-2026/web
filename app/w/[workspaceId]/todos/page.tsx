"use client";

// 할 일 화면: 추가(제목·담당자·마감일), 완료 체크, 담당자 바꾸기, 삭제.
// 담당자는 멤버 목록에서 골라요.

import { useRef, useState } from "react";
import { cn } from "cn";
import { Segmented } from "@/components/ui/segmented";
import { TopBar, TopBarDivider, TopBarTitle } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ErrorText, Input, Select } from "@/components/ui/field";
import { dDay, shortDate } from "@/components/ui/format";
import { IconAdd, IconCheck, IconDelete, IconTodo } from "@/components/ui/icons";
import { Panel, PanelPage } from "@/components/ui/panel";
import { DueBadge } from "@/components/workspace/UpcomingPanel";
import { BackToChat } from "@/components/workspace/BackToChat";
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

  // 더블클릭하면 state가 바뀌기 전에 두 번째 클릭이 들어와요. 바로 바뀌는 ref로 한 번만 보내요.
  const adding = useRef(false);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || adding.current) return;
    adding.current = true;
    try {
      const err = await ws.createTodo({ title: title.trim(), assignee_id: assignee ? Number(assignee) : null, due_date: due || null });
      if (err) return setError(err);
      setTitle("");
      setDue("");
      setError("");
    } finally {
      adding.current = false;
    }
  };

  const run = async (p: Promise<string | null>) => {
    const err = await p;
    setError(err ?? "");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar>
        <BackToChat />
        <TopBarDivider />
        <TopBarTitle icon={IconTodo}>할 일</TopBarTitle>
        <span className="ml-auto shrink-0 text-sm text-muted-foreground"><span className="tabular-nums">{doneCount}/{ws.todos.length}</span> 완료</span>
      </TopBar>
      <PanelPage
        main={
          <>
            <Panel title="할 일 추가">
              <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="새 할 일 (예: 발표 자료 초안)" className="sm:flex-1" />
                <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="sm:w-36" aria-label="담당자">
                  <option value="">담당자 없음</option>
                  {ws.members.map((m) => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}
                </Select>
                <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="sm:w-40" aria-label="마감일" />
                <Button type="submit" className="h-auto py-2"><IconAdd /> 추가</Button>
              </form>
              {error && <div className="mt-2"><ErrorText>{error}</ErrorText></div>}
            </Panel>

            {/* 목록: 제목 띠에 탭, 안쪽은 줄 구분선으로 나눈 표 모양 */}
            <Panel
              title={`${TABS.find((t) => t.key === tab)?.label} ${sorted.length}개`}
              bodyClassName="p-0"
              action={
                <Segmented value={tab} onChange={setTab} options={TABS.map((t) => ({ value: t.key, label: t.label }))} />
              }
            >
              {sorted.length === 0 ? (
                <p className="p-10 text-center text-sm text-muted-foreground">
                  {tab === "done" ? "아직 끝낸 일이 없어요" : "할 일이 없어요"}
                </p>
              ) : (
                <ul className="divide-y">
                  {sorted.map((t) => (
                    <TodoRow key={t.id} todo={t} onChange={(patch) => run(ws.updateTodo(t.id, patch))} onDelete={() => run(ws.deleteTodo(t.id))} />
                  ))}
                </ul>
              )}
            </Panel>
          </>
        }
        side={<Summary />}
      />
    </div>
  );
}

/** 오른쪽 요약: 진행률 + 상태별 개수 + 담당자별 남은 일 */
function Summary() {
  const ws = useWorkspace();
  const total = ws.todos.length;
  const done = ws.todos.filter((t) => t.done).length;
  const left = ws.todos.filter((t) => !t.done);
  const overdue = left.filter((t) => t.due_date && dDay(t.due_date).diff < 0).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const byMember = ws.members
    .map((m) => ({ m, n: left.filter((t) => t.assignee_id === m.user_id).length }))
    .sort((a, b) => b.n - a.n);
  const nobody = left.filter((t) => !t.assignee_id).length;

  return (
    <>
      <Panel title="진행 상황" action={<span className="text-sm font-semibold tabular-nums text-primary">{pct}%</span>}>
        <div className="h-2 overflow-hidden rounded-sm bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full origin-left bg-primary transition-transform duration-250" style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
        <dl className="mt-3 grid grid-cols-3 divide-x rounded-md border text-center">
          <Stat label="남음" value={left.length} />
          <Stat label="완료" value={done} />
          <Stat label="마감 지남" value={overdue} warn={overdue > 0} />
        </dl>
      </Panel>

      <Panel title="담당자별 남은 일" bodyClassName="p-2">
        <ul className="flex flex-col">
          {byMember.map(({ m, n }) => (
            <li key={m.user_id} className="flex h-10 items-center gap-2.5 rounded-md px-2">
              <Avatar id={m.user_id} className="size-7" />
              <span className="min-w-0 flex-1 truncate text-sm">{m.name}{m.user_id === ws.me?.id && <span className="text-muted-foreground"> (나)</span>}</span>
              <span className={cn("text-sm font-semibold tabular-nums", n === 0 && "font-normal text-muted-foreground")}>{n}</span>
            </li>
          ))}
          {nobody > 0 && (
            <li className="flex h-10 items-center gap-2.5 rounded-md px-2 text-muted-foreground">
              <span className="size-7 rounded-full border border-dashed" />
              <span className="flex-1 text-sm">담당자 없음</span>
              <span className="text-sm font-semibold tabular-nums">{nobody}</span>
            </li>
          )}
        </ul>
      </Panel>
    </>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("text-lg font-semibold tabular-nums", warn && "text-destructive")}>{value}</dd>
    </div>
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
    <li className={cn("group flex min-h-14 items-center gap-3 px-4 py-2 transition hover:bg-muted/40", t.done && "bg-muted/30")}>
      {/* 네모 체크박스: 진짜 input은 숨기고(키보드로 누를 수 있어요) 옆 칸이 모양을 그려요 */}
      <span className="relative flex size-5 shrink-0">
        <input
          type="checkbox"
          checked={t.done}
          onChange={() => onChange({ done: !t.done })}
          className="peer absolute inset-0 cursor-pointer appearance-none rounded-sm border border-input bg-card checked:border-primary checked:bg-primary focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label={`${t.title} 완료`}
        />
        <IconCheck className="pointer-events-none absolute inset-0 m-auto size-4 text-primary-foreground opacity-0 peer-checked:opacity-100" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate", t.done && "text-muted-foreground line-through")}>{t.title}</p>
        {t.due_date && <p className="text-xs text-muted-foreground">마감 <span className="tabular-nums">{shortDate(t.due_date)}</span></p>}
      </div>
      {t.due_date && !t.done && <DueBadge date={t.due_date} />}
      <label className="flex items-center gap-1.5" title="담당자 바꾸기">
        {who ? <Avatar id={who.user_id} className="size-7" /> : <span className="size-7 rounded-full border border-dashed" />}
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
        title="삭제"
        className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
      >
        <IconDelete className="size-4" />
      </button>
    </li>
  );
}

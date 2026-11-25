"use client";

// 채팅 화면 오른쪽 "일정" 탭: 다가오는 일정 + 아직 안 끝난 할 일. (오른쪽 칸 틀은 채팅 화면이 그려요)

import Link from "next/link";
import { cn } from "cn";
import { DateLeaf } from "@/components/ui/date-leaf";
import { dDay, timeLabel, todayStr } from "@/components/ui/format";
import { IconCalendar, IconNext, IconTodo } from "@/components/ui/icons";
import { useWorkspace } from "./WorkspaceProvider";

export function UpcomingPanel() {
  const ws = useWorkspace();
  const today = todayStr();
  const events = ws.events
    .filter((e) => e.status !== "cancelled" && e.status !== "rejected" && e.date >= today)
    .sort((a, b) => (a.date + (a.start ?? "")).localeCompare(b.date + (b.start ?? "")))
    .slice(0, 5);
  const mine = ws.todos.filter((t) => !t.done && t.assignee_id === ws.me?.id);
  const todos = (mine.length ? mine : ws.todos.filter((t) => !t.done)).slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      <section>
        <Heading href={`${ws.base}/calendar`}><IconCalendar className="size-4" /> 다가오는 일정</Heading>
        {events.length === 0 ? (
          <Empty>예정된 일정이 없어요</Empty>
        ) : (
          <ul className="flex flex-col gap-2">
            {events.map((e) => {
              const { diff } = dDay(e.date);
              return (
                <li key={e.id} className="flex items-center gap-3 rounded-xl border bg-card p-2.5">
                  <DateLeaf date={e.date} ai={e.source === "ai"} size="sm" />
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium">{e.title}</p>
                    <p className="truncate font-mono text-xs tabular-nums text-muted-foreground">
                      {diff === 0 ? "오늘" : diff === 1 ? "내일" : `${diff}일 뒤`}
                      {timeLabel(e) && ` · ${timeLabel(e)}`}
                      {e.location && ` · ${e.location}`}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <Heading href={`${ws.base}/todos`}><IconTodo className="size-4" /> {mine.length ? "내 할 일" : "남은 할 일"}</Heading>
        {todos.length === 0 ? (
          <Empty>할 일을 모두 끝냈어요</Empty>
        ) : (
          <ul className="flex flex-col gap-2">
            {todos.map((t) => (
              <li key={t.id} className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={t.done}
                  onChange={() => ws.updateTodo(t.id, { done: !t.done })}
                  aria-label={`${t.title} 완료`}
                />
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                {t.due_date && <DueBadge date={t.due_date} />}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** 마감일까지 남은 날 (D-3 같은 글자). 마감이 지났으면 빨간색 */
export function DueBadge({ date }: { date: string }) {
  const { diff, label } = dDay(date);
  return (
    <span className={cn("shrink-0 font-mono text-xs font-medium tabular-nums", diff < 0 ? "text-destructive" : "text-muted-foreground")}>
      {label}
    </span>
  );
}

function Heading({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between px-1">
      <h2 className="flex items-center gap-1.5 font-sans text-sm font-semibold">{children}</h2>
      <Link href={href} className="flex items-center text-xs text-muted-foreground hover:text-primary">
        전체 <IconNext className="size-4" />
      </Link>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="p-2 text-center text-xs text-muted-foreground">{children}</p>;
}

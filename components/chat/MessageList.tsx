"use client";

import { CalendarPlus, Flag, Sparkles } from "lucide-react";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "cn";
import type { Message, Workspace } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { clock, dayLabel } from "@/components/ui/format";
import { MaskedMessage, type ReportFn } from "./MaskedMessage";

/** 메시지 사이에 끼워 넣을 것 (AI 일정 카드). created_at 순서대로 섞여 보여요. */
export type TimelineCard = { key: string; created_at: string; node: React.ReactNode };

type Item = { kind: "msg"; m: Message; at: string } | { kind: "card"; c: TimelineCard; at: string };

// 같은 사람이 3분 안에 연달아 보낸 메시지는 이름과 아바타를 한 번만 보여줘요.
const GROUP_MS = 3 * 60 * 1000;

export function MessageList({ messages, hasMore, onLoadOlder, meId, cards = [], filterMode, isOwner, onReport, onMakeEvent }: {
  messages: Message[];
  hasMore: boolean;
  onLoadOlder: () => void | Promise<void>;
  meId?: number;
  cards?: TimelineCard[];
  filterMode?: Workspace["filter_mode"];
  isOwner?: boolean;
  onReport?: ReportFn;
  /** 메시지 옆 📅 버튼: 이 메시지 내용으로 일정 만들기 */
  onMakeEvent?: (m: Message) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [reported, setReported] = useState<Set<number>>(new Set());
  // 스크롤 위치를 맞추려고 직전 상태를 기억해 둬요
  const prev = useRef({ first: undefined as number | undefined, last: undefined as number | undefined, count: 0, height: 0 });

  const items: Item[] = [
    ...messages.map((m) => ({ kind: "msg" as const, m, at: m.created_at })),
    ...cards.map((c) => ({ kind: "card" as const, c, at: c.created_at })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const first = messages[0]?.id;
    const last = messages.at(-1)?.id;
    const p = prev.current;
    if (p.count === 0) {
      el.scrollTop = el.scrollHeight; // 처음 열면 맨 아래로
    } else if (first !== p.first && last === p.last) {
      el.scrollTop += el.scrollHeight - p.height; // 위에 옛 메시지가 붙으면 보던 자리 유지
    } else {
      // 새 메시지가 붙기 전에 맨 아래 근처를 보고 있었다면 따라 내려가요 (위쪽 옛 대화를 읽는 중이면 그대로)
      const nearBottom = p.height - el.scrollTop - el.clientHeight < 160;
      const mine = messages.at(-1)?.user_id === meId;
      if (nearBottom || mine) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
    prev.current = { first, last, count: messages.length, height: el.scrollHeight };
  }, [messages, meId]);

  // 카드가 새로 뜨면 보이도록 아래로
  useEffect(() => {
    if (cards.length) box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" });
  }, [cards.length]);

  const onScroll = async () => {
    const el = box.current;
    if (!el || !hasMore || loadingOlder || el.scrollTop > 40) return;
    prev.current.height = el.scrollHeight;
    setLoadingOlder(true);
    await onLoadOlder();
    setLoadingOlder(false);
  };

  const reportMissed = async (id: number) => {
    if (!onReport || !confirm("이 메시지를 욕설로 신고할까요?")) return;
    const err = await onReport(id, "missed");
    if (err) alert(err);
    else setReported((s) => new Set(s).add(id));
  };

  return (
    <div ref={box} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-4">
      {hasMore && (
        <div className="mb-3 text-center">
          <button
            onClick={onScroll}
            className="rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground hover:bg-secondary"
          >
            {loadingOlder ? "불러오는 중…" : "이전 메시지 더 보기"}
          </button>
        </div>
      )}

      {items.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <span className="text-4xl">💬</span>
          <p>첫 메시지를 보내 보세요!</p>
          <p className="text-xs">“목요일 7시에 회의 어때?”처럼 일정을 이야기하면 AI가 캘린더 등록을 도와줘요</p>
        </div>
      )}

      <ul className="flex flex-col">
        {items.map((it, i) => {
          const before = items[i - 1];
          const newDay = !before || dayLabel(before.at) !== dayLabel(it.at);
          const sep = newDay && (
            <li className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {dayLabel(it.at)}
              <span className="h-px flex-1 bg-border" />
            </li>
          );

          if (it.kind === "card") {
            return (
              <Fragment key={it.c.key}>
                {sep}
                {/* AI 일정 카드는 "AI 일정 도우미"가 보낸 메시지처럼 왼쪽에 붙여요 */}
                <li className="animate-pop mt-3 flex gap-2">
                  <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Sparkles className="size-4" />
                  </span>
                  <div className="flex min-w-0 max-w-md flex-1 flex-col items-start">
                    <span className="mb-1 ml-1 text-xs font-medium text-foreground/70">AI 일정 도우미</span>
                    {it.c.node}
                  </div>
                </li>
              </Fragment>
            );
          }

          const m = it.m;
          const mine = m.user_id === meId;
          const grouped =
            !newDay && before?.kind === "msg" && before.m.user_id === m.user_id &&
            new Date(m.created_at).getTime() - new Date(before.m.created_at).getTime() < GROUP_MS;

          return (
            <Fragment key={m.id}>
              {sep}
              <li className={cn("group flex gap-2", mine ? "flex-row-reverse" : "", grouped ? "mt-1" : "mt-3", "animate-pop")}>
                {!mine && (grouped ? <span className="w-9 shrink-0" /> : <Avatar id={m.user_id} name={m.user_name} />)}
                <div className={cn("flex max-w-[78%] flex-col", mine ? "items-end" : "items-start")}>
                  {!mine && !grouped && <span className="mb-1 ml-1 text-xs font-medium text-foreground/70">{m.user_name}</span>}
                  <div className={cn("flex items-end gap-1.5", mine && "flex-row-reverse")}>
                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-xs",
                        mine
                          ? "rounded-tr-md bg-primary text-primary-foreground"
                          : "rounded-tl-md border bg-card",
                      )}
                    >
                      <MaskedMessage message={m} mode={filterMode} isOwner={isOwner} mine={mine} onReport={onReport} />
                    </div>
                    <span className="shrink-0 pb-0.5 text-xs text-muted-foreground">{clock(m.created_at)}</span>
                    {/* 마우스를 올리면 말풍선 바로 옆에 나타나는 작은 도구 (읽던 자리에서 바로 누를 수 있게) */}
                    <span className="flex items-center gap-0.5 rounded-lg border bg-card p-0.5 opacity-0 shadow-xs transition focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
                      {onMakeEvent && !m.is_profane && (
                        <button
                          onClick={() => onMakeEvent(m)}
                          title="이 메시지로 일정 만들기"
                          aria-label="이 메시지로 일정 만들기"
                          className="rounded-md p-1 text-muted-foreground transition hover:bg-secondary hover:text-primary"
                        >
                          <CalendarPlus className="size-4" />
                        </button>
                      )}
                      {onReport && !m.is_profane && !mine && (
                        reported.has(m.id) ? (
                          <span className="px-1 text-xs text-muted-foreground">신고됨</span>
                        ) : (
                          <button
                            onClick={() => reportMissed(m.id)}
                            title="욕설인데 안 가려졌다면 신고"
                            aria-label="욕설 신고"
                            className="rounded-md p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Flag className="size-4" />
                          </button>
                        )
                      )}
                    </span>
                  </div>
                </div>
              </li>
            </Fragment>
          );
        })}
      </ul>
    </div>
  );
}

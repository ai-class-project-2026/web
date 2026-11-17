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
    <div ref={box} onScroll={onScroll} className="flex-1 overflow-y-auto pb-3 pt-1">
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
            <li className="mx-4 my-3 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {dayLabel(it.at)}
              <span className="h-px flex-1 bg-border" />
            </li>
          );

          if (it.kind === "card") {
            return (
              <Fragment key={it.c.key}>
                {sep}
                {/* AI 일정 카드는 "AI 일정 도우미"가 보낸 메시지처럼 다른 메시지와 같은 줄 모양으로 */}
                <li className="animate-pop mt-2.5 flex gap-3 px-4 py-px">
                  <span aria-hidden className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Sparkles className="size-5" />
                  </span>
                  <div className="min-w-0 max-w-lg flex-1">
                    <p className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold">AI 일정 도우미</span>
                      <span className="rounded bg-secondary px-1 text-xs text-secondary-foreground">제안</span>
                      <span className="text-xs text-muted-foreground">{clock(it.at)}</span>
                    </p>
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

          // 한 줄 = [아바타 40px] [이름 · 시간 / 내용]. 말풍선 없이 왼쪽 정렬이라 긴 대화도 읽기 편해요.
          // 같은 사람이 연달아 보내면 아바타·이름을 생략하고, 마우스를 올리면 왼쪽에 시간만 보여줘요.
          return (
            <Fragment key={m.id}>
              {sep}
              <li className={cn("animate-pop group relative flex gap-3 px-4 py-px hover:bg-muted/60", grouped ? "" : "mt-2.5")}>
                {grouped ? (
                  <span className="w-9 shrink-0 text-right text-[0.6875rem] leading-6 text-muted-foreground opacity-0 group-hover:opacity-100">
                    {clock(m.created_at).replace(/^(오전|오후) /, "")}
                  </span>
                ) : (
                  <Avatar id={m.user_id} name={m.user_name} className="mt-0.5 size-9" />
                )}
                <div className="min-w-0 flex-1">
                  {!grouped && (
                    <p className="flex items-baseline gap-2">
                      <span className={cn("text-sm font-semibold", mine && "text-primary")}>{m.user_name}</span>
                      <span className="text-xs text-muted-foreground">{clock(m.created_at)}</span>
                    </p>
                  )}
                  <div className="text-[0.9375rem] leading-normal">
                    <MaskedMessage message={m} mode={filterMode} isOwner={isOwner} onReport={onReport} />
                  </div>
                </div>

                {/* 마우스를 올리면 이 줄 오른쪽 위에 뜨는 도구 (터치 화면에서는 항상 보여요) */}
                {(onMakeEvent || onReport) && !m.is_profane && (
                  <span className="absolute -top-3 right-4 z-10 flex items-center gap-0.5 rounded-md border bg-card p-0.5 opacity-0 shadow-sm transition focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
                    {onMakeEvent && (
                      <button
                        onClick={() => onMakeEvent(m)}
                        title="이 메시지로 일정 만들기"
                        aria-label="이 메시지로 일정 만들기"
                        className="flex size-8 items-center justify-center rounded text-muted-foreground transition hover:bg-secondary hover:text-primary"
                      >
                        <CalendarPlus className="size-5" />
                      </button>
                    )}
                    {onReport && !mine && (
                      reported.has(m.id) ? (
                        <span className="px-2 text-xs text-muted-foreground">신고됨</span>
                      ) : (
                        <button
                          onClick={() => reportMissed(m.id)}
                          title="욕설인데 안 가려졌다면 신고"
                          aria-label="욕설 신고"
                          className="flex size-8 items-center justify-center rounded text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Flag className="size-5" />
                        </button>
                      )
                    )}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ul>
    </div>
  );
}

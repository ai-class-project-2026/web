"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "cn";
import type { Message, Workspace } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { clock, dayLabel } from "@/components/ui/format";
import { IconAI, IconChat, IconEventAdd, IconReport, IconWarning } from "@/components/ui/icons";
import { MaskedMessage, type ReportFn } from "./MaskedMessage";

/** 메시지 사이에 끼워 넣을 것 (AI 일정 카드). created_at 순서대로 섞여 보여요. */
export type TimelineCard = { key: string; created_at: string; node: React.ReactNode };

type Item = { kind: "msg"; m: Message; at: string } | { kind: "card"; c: TimelineCard; at: string };

// 시간순으로 줄 세워요. 시각이 같으면 메시지가 카드보다 먼저, 메시지끼리는 id 순서로 해서 늘 같은 순서가 되게 해요.
// (소켓으로 순서가 뒤바뀌어 도착해도 화면은 항상 같은 순서예요)
function byTime(a: Item, b: Item) {
  const d = Date.parse(a.at) - Date.parse(b.at);
  if (d) return d;
  if (a.kind !== b.kind) return a.kind === "msg" ? -1 : 1;
  if (a.kind === "msg" && b.kind === "msg") return a.m.id - b.m.id;
  return a.kind === "card" && b.kind === "card" ? a.c.key.localeCompare(b.c.key, undefined, { numeric: true }) : 0;
}

// 같은 사람이 3분 안에 연달아 보낸 메시지는 이름과 아바타를 한 번만 보여줘요.
const GROUP_MS = 3 * 60 * 1000;

export function MessageList({ messages, hasMore, onLoadOlder, meId, cards = [], filterMode, isOwner, onReport, onMakeEvent, loaded = true, historyError = false }: {
  messages: Message[];
  /** 첫 기록을 받았는지. 받기 전에는 "첫 메시지를 보내 보세요"를 보여주지 않아요 */
  loaded?: boolean;
  /** 첫 기록을 못 받았어요: 빈 채널처럼 보이지 않게 오류 안내를 보여줘요 */
  historyError?: boolean;
  hasMore: boolean;
  onLoadOlder: () => void | Promise<void>;
  meId?: number;
  cards?: TimelineCard[];
  filterMode?: Workspace["filter_mode"];
  isOwner?: boolean;
  onReport?: ReportFn;
  /** 메시지 옆 일정 버튼: 이 메시지 내용으로 일정 만들기 */
  onMakeEvent?: (m: Message) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reported, setReported] = useState<Set<number>>(new Set());
  const reporting = useRef(new Set<number>()); // 신고 중인 메시지: 연타해도 한 번만 보내요
  // 화면을 연 뒤에 새로 온 것만 나타나는 효과를 줘요 (채널을 열거나 옛 대화를 불러올 때는 조용히)
  // ponytail: 서버 시계가 내 시계보다 느리면 효과만 빠져요
  const [openedAt] = useState(() => Date.now());
  const isNew = (at: string) => Date.parse(at) > openedAt;
  // 스크롤 위치를 맞추려고 직전 상태를 기억해 둬요
  const prev = useRef({ first: undefined as number | undefined, last: undefined as number | undefined, count: 0, height: 0 });

  const items: Item[] = [
    ...messages.map((m) => ({ kind: "msg" as const, m, at: m.created_at })),
    ...cards.map((c) => ({ kind: "card" as const, c, at: c.created_at })),
  ].sort(byTime);

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

  // 이전 메시지 불러오기. 실패해도 "불러오는 중…"에 멈추지 않게 finally에서 꼭 풀어 줘요.
  const loadMore = async () => {
    const el = box.current;
    if (!el || loadingOlder) return;
    prev.current.height = el.scrollHeight;
    setLoadingOlder(true);
    setLoadError(false);
    try {
      await onLoadOlder();
    } catch {
      setLoadError(true);
    } finally {
      setLoadingOlder(false);
    }
  };

  // 맨 위로 스크롤하면 자동으로 불러와요. 실패한 뒤에는 버튼으로 다시 시도할 때까지 멈춰요.
  const onScroll = () => {
    const el = box.current;
    if (!el || !hasMore || loadError || el.scrollTop > 40) return;
    loadMore();
  };

  const reportMissed = async (id: number) => {
    if (!onReport || reporting.current.has(id)) return;
    reporting.current.add(id); // 확인 창이 떠 있는 동안에도 막아요
    try {
      if (!confirm("이 메시지를 욕설로 신고할까요?")) return;
      const err = await onReport(id, "missed");
      if (err) alert(err);
      else setReported((s) => new Set(s).add(id));
    } finally {
      reporting.current.delete(id);
    }
  };

  return (
    <div ref={box} onScroll={onScroll} className="flex-1 overflow-y-auto pb-4 pt-1">
      {hasMore && (
        <div className="mb-3 text-center">
          {loadError && !loadingOlder && <p className="mb-1 text-xs text-destructive">이전 메시지를 불러오지 못했어요</p>}
          <button
            onClick={loadMore}
            disabled={loadingOlder}
            className="rounded-md border bg-card px-4 py-1.5 text-sm text-muted-foreground hover:bg-secondary"
          >
            {loadingOlder ? "불러오는 중…" : loadError ? "다시 시도" : "이전 메시지 더 보기"}
          </button>
        </div>
      )}

      {items.length === 0 && historyError && (
        <div role="alert" className="flex h-full flex-col items-center justify-center gap-2 text-center text-destructive">
          <IconWarning className="size-6" />
          <p>메시지를 불러오지 못했어요</p>
          <p className="text-xs text-muted-foreground">잠시 후 자동으로 다시 불러와요</p>
        </div>
      )}

      {items.length === 0 && !historyError && loaded && (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <IconChat className="size-6" />
          <p>첫 메시지를 보내 보세요</p>
          <p className="text-xs">“목요일 7시에 회의 어때?”처럼 일정을 이야기하면 AI가 캘린더 등록을 도와줘요</p>
        </div>
      )}

      <ul className="flex flex-col">
        {items.map((it, i) => {
          const before = items[i - 1];
          const newDay = !before || dayLabel(before.at) !== dayLabel(it.at);
          const sep = newDay && (
            <li className="mx-4 mb-2 mt-6 flex items-center gap-2 text-meta tabular-nums text-muted-foreground">
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
                <li className={cn("mt-chat-group flex gap-4 px-4 py-0.5", isNew(it.at) && "animate-card")}>
                  <span aria-hidden className="mt-0.5 flex size-chat-avatar shrink-0 items-center justify-center rounded-lg bg-highlight text-highlight-foreground">
                    <IconAI className="size-5" />
                  </span>
                  <div className="min-w-0 max-w-lg flex-1">
                    <p className="flex items-baseline gap-2">
                      <span className="text-chat font-medium">AI 일정 도우미</span>
                      <span className="text-meta tabular-nums text-muted-foreground">{clock(it.at)}</span>
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

          // 한 줄 = [아바타 40px] [이름 · 시간 / 내용]. 왼쪽 정렬이라 긴 대화도 읽기 편해요.
          // 같은 사람이 연달아 보내면 아바타·이름을 생략하고, 마우스를 올리면 왼쪽에 시간만 보여줘요.
          return (
            <Fragment key={m.id}>
              {sep}
              <li className={cn("group relative flex gap-4 px-4 py-0.5 hover:bg-muted/60", grouped ? "mt-chat-line" : "mt-chat-group", isNew(it.at) && "animate-pop")}>
                {grouped ? (
                  <span className="w-chat-avatar shrink-0 text-right text-meta tabular-nums leading-[1.375rem] text-muted-foreground opacity-0 group-hover:opacity-100">
                    {clock(m.created_at).replace(/^(오전|오후) /, "")}
                  </span>
                ) : (
                  <Avatar id={m.user_id} className="mt-0.5 size-chat-avatar" />
                )}
                <div className="min-w-0 flex-1">
                  {!grouped && (
                    <p className="flex items-baseline gap-2">
                      <span className={cn("text-chat font-medium", mine && "text-primary")}>{m.user_name}</span>
                      <span className="text-meta tabular-nums text-muted-foreground">{clock(m.created_at)}</span>
                    </p>
                  )}
                  <div className="text-chat">
                    <MaskedMessage message={m} mode={filterMode} isOwner={isOwner} onReport={onReport} />
                  </div>
                </div>

                {/* 마우스를 올리면 이 줄 오른쪽 위에 뜨는 도구. 터치 화면에서는 테두리 없는 작은 아이콘으로 줄 오른쪽 끝에 자리를 잡고 항상 보여요 */}
                {(onMakeEvent || onReport) && !m.is_profane && (
                  <span className="absolute -top-3 right-4 z-10 flex items-center gap-0.5 rounded-md border bg-card p-0.5 opacity-0 transition focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:static [@media(hover:none)]:z-auto [@media(hover:none)]:shrink-0 [@media(hover:none)]:self-start [@media(hover:none)]:gap-1 [@media(hover:none)]:rounded-none [@media(hover:none)]:border-0 [@media(hover:none)]:bg-transparent [@media(hover:none)]:p-0 [@media(hover:none)]:opacity-100">
                    {onMakeEvent && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onMakeEvent(m)}
                        title="이 메시지로 일정 만들기"
                        aria-label="이 메시지로 일정 만들기"
                        className="text-muted-foreground hover:text-primary [@media(hover:none)]:size-6"
                      >
                        <IconEventAdd className="size-5 [@media(hover:none)]:size-4" />
                      </Button>
                    )}
                    {onReport && !mine && (
                      reported.has(m.id) ? (
                        <span className="px-2 text-xs text-muted-foreground">신고됨</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => reportMissed(m.id)}
                          title="욕설인데 안 가려졌다면 신고"
                          aria-label="욕설 신고"
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive [@media(hover:none)]:size-6"
                        >
                          <IconReport className="size-5 [@media(hover:none)]:size-4" />
                        </Button>
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

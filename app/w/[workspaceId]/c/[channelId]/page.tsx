"use client";

// 채팅 화면: 가운데 메시지 + AI 일정 카드, 오른쪽 [일정 | 멤버] 탭.
// 진짜 서버면 useMessages / useSuggestions(@/lib/ws), 데모(/w/demo…)면 lib/dummy.ts 데이터를 써요.
//
// 마우스 이동 줄이기
//  - 오른쪽 칸 전환 버튼은 채널 제목 줄 오른쪽 끝 한곳에 모았어요.
//  - 일정 추가는 입력창 왼쪽 📅 버튼, 또는 메시지에 마우스를 올려 나오는 📅 버튼으로 바로.

import { CalendarDays, CalendarPlus, Hash, Sparkles, Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { cn } from "cn";
import { TopBar, TopBarDivider, TopBarTitle } from "@/components/app/TopBar";
import { EventDialog, type EventDraft } from "@/components/calendar/EventDialog";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList, type TimelineCard } from "@/components/chat/MessageList";
import type { ReportFn } from "@/components/chat/MaskedMessage";
import { ScheduleCard } from "@/components/schedule-card/ScheduleCard";
import { errorText, todayStr } from "@/components/ui/format";
import { rememberChannel } from "@/components/workspace/BackToChat";
import { MembersPanel } from "@/components/workspace/MembersPanel";
import { UpcomingPanel } from "@/components/workspace/UpcomingPanel";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";
import { api, type EventInput, type Message, type Suggestion } from "@/lib/api";
import { demoModerate } from "@/lib/dummy";
import { useMessages, useSuggestions } from "@/lib/ws";

type Action = "added" | "edited" | "ignored";

export default function ChatPage() {
  const channelId = Number(useParams<{ channelId: string }>().channelId);
  const { demo } = useWorkspace();
  // key: 채널을 옮기면 화면 상태(스크롤 등)를 새로 시작
  return demo ? <DemoChat key={channelId} channelId={channelId} /> : <LiveChat key={channelId} channelId={channelId} />;
}

/* 진짜 서버 */
function LiveChat({ channelId }: { channelId: number }) {
  const ws = useWorkspace();
  const { messages, send, loadOlder, hasMore } = useMessages(channelId);
  const { suggestions, act } = useSuggestions(channelId);

  const onAct = async (s: Suggestion, action: Action, edited?: EventInput) => {
    try {
      const r = await act(s.id, action, edited);
      if (!r.ok) return errorText(r.error);
      if (action !== "ignored") ws.reloadEvents(); // 캘린더/오른쪽 일정 새로고침
      return null;
    } catch {
      return "서버에 연결할 수 없어요";
    }
  };

  const onReport: ReportFn = async (message_id, type) => {
    try {
      const { error, response } = await api.POST("/reports", { body: { message_id, type } });
      return response.ok ? null : errorText(error);
    } catch {
      return "서버에 연결할 수 없어요";
    }
  };

  return (
    <ChatView
      channelId={channelId}
      messages={messages}
      hasMore={hasMore}
      onLoadOlder={loadOlder}
      onSend={send}
      suggestions={suggestions}
      onAct={onAct}
      onReport={onReport}
    />
  );
}

/* 데모: 메시지와 카드를 화면 안에서만 바꿔요 */
function DemoChat({ channelId }: { channelId: number }) {
  const ws = useWorkspace();
  const chat = ws.demoChat!;
  const messages = chat.messages.filter((m) => m.channel_id === channelId);
  const suggestions = chat.suggestions.filter((s) => s.channel_id === channelId);
  const { setMessages, setSuggestions } = chat;
  const me = ws.me!;

  const send = useCallback(
    async (text: string) => {
      const m: Message = {
        id: Date.now(), channel_id: channelId, user_id: me.id, user_name: me.name, text,
        created_at: new Date().toISOString(), ...demoModerate(text),
      };
      setMessages((ms) => [...ms, m]);
      return { ok: true };
    },
    [channelId, me, setMessages],
  );

  const onAct = async (s: Suggestion, action: Action, edited?: EventInput) => {
    const { kind, event, event_id } = s.payload;
    if (action !== "ignored") {
      const e = edited ?? { ...event };
      if (kind === "add") await ws.createEvent({ ...e, weekday: undefined } as EventInput);
      if (kind === "update" && event_id) await ws.updateEvent(event_id, { ...e, status: "confirmed" });
      if (kind === "cancel" && event_id) await ws.updateEvent(event_id, { status: "cancelled" });
    }
    setSuggestions((ss) => ss.filter((x) => x.id !== s.id));
    return null;
  };

  return (
    <ChatView
      channelId={channelId}
      messages={messages}
      hasMore={false}
      onLoadOlder={() => {}}
      onSend={send}
      suggestions={suggestions}
      onAct={onAct}
      onReport={async () => null}
    />
  );
}

/* 공통 화면 */
function ChatView({ channelId, messages, hasMore, onLoadOlder, onSend, suggestions, onAct, onReport }: {
  channelId: number;
  messages: Message[];
  hasMore: boolean;
  onLoadOlder: () => void | Promise<void>;
  onSend: (text: string) => unknown;
  suggestions: Suggestion[];
  onAct: (s: Suggestion, action: Action, edited?: EventInput) => Promise<string | null>;
  onReport: ReportFn;
}) {
  const ws = useWorkspace();
  const channel = ws.channels.find((c) => c.id === channelId);
  const [panel, setPanel] = useState<"schedule" | "members" | null>("schedule");
  const [draft, setDraft] = useState<EventDraft | null>(null);

  // 캘린더·할 일 화면의 "채팅으로 돌아가기"가 이 채널로 돌아오게 기억해 둬요
  useEffect(() => rememberChannel(ws.base, channelId), [ws.base, channelId]);

  const cards: TimelineCard[] = suggestions.map((s) => ({
    key: `s${s.id}`,
    created_at: s.created_at,
    node: (
      <ScheduleCard
        suggestion={s}
        current={ws.events.find((e) => e.id === s.payload.event_id)}
        onAct={(action, edited) => onAct(s, action, edited)}
      />
    ),
  }));

  const toggle = (p: "schedule" | "members") => setPanel((cur) => (cur === p ? null : p));

  return (
    <div className="flex min-h-0 flex-1">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* 상단 바: 왼쪽 채널 이름, 오른쪽 끝에 오른쪽 칸 전환 버튼 */}
        <TopBar>
          <TopBarTitle icon={Hash}>{channel?.name ?? "채널"}</TopBarTitle>
          {ws.workspace?.ai_schedule_on && (
            <>
              <TopBarDivider />
              <span className="hidden items-center gap-1 truncate text-sm text-muted-foreground sm:flex" title="대화에서 일정을 찾아 카드로 알려줘요">
                <Sparkles className="size-4 text-primary" /> AI 일정 도우미 켜짐
              </span>
            </>
          )}
          <div className="ml-auto hidden items-center gap-1 xl:flex">
            <ToolButton active={panel === "schedule"} onClick={() => toggle("schedule")} label="다가오는 일정 보기">
              <CalendarDays className="size-5" /> 일정
            </ToolButton>
            <ToolButton active={panel === "members"} onClick={() => toggle("members")} label="멤버 목록 보기">
              <Users className="size-5" /> 멤버 {ws.members.length}
            </ToolButton>
          </div>
        </TopBar>

        <MessageList
          messages={messages}
          hasMore={hasMore}
          onLoadOlder={onLoadOlder}
          meId={ws.me?.id}
          cards={cards}
          filterMode={ws.workspace?.filter_mode}
          isOwner={ws.isOwner}
          onReport={onReport}
          onMakeEvent={(m) => setDraft({ date: todayStr(), title: m.text.slice(0, 40) })}
        />
        <MessageInput
          onSend={onSend}
          placeholder={`#${channel?.name ?? "채널"}에 메시지 보내기`}
          leading={
            <button
              type="button"
              onClick={() => setDraft({ date: todayStr() })}
              title="일정 바로 추가"
              aria-label="일정 바로 추가"
              className="flex h-9 shrink-0 items-center gap-1 rounded-md px-2 text-sm text-muted-foreground transition hover:bg-background hover:text-primary"
            >
              <CalendarPlus className="size-5" /> 일정
            </button>
          }
        />
      </main>

      {panel && (
        <aside className="hidden w-64 shrink-0 overflow-y-auto border-l bg-sidebar px-2 py-3 xl:block">
          {panel === "schedule" ? <UpcomingPanel /> : <MembersPanel />}
        </aside>
      )}

      <EventDialog
        draft={draft}
        members={ws.members}
        onClose={() => setDraft(null)}
        onCreate={ws.createEvent}
        onUpdate={ws.updateEvent}
        onDelete={ws.deleteEvent}
      />
    </div>
  );
}

function ToolButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm transition",
        active ? "bg-secondary font-medium text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

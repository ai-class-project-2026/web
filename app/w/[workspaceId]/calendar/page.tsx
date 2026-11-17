"use client";

// 캘린더 화면 (FullCalendar v7: 플러그인은 @fullcalendar/react/daygrid 처럼 하위 경로에서 가져와요)
//  - 날짜 누르기: 새 일정 / 일정 누르기: 수정·취소·삭제 / 끌어다 놓기: 날짜 옮기기
//  - AI가 만든 일정은 ✨ 표시, 취소된 일정은 회색 (기본은 숨김)

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import koLocale from "@fullcalendar/react/locales/ko";
import breezyTheme from "@fullcalendar/react/themes/breezy";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/breezy/theme.css";
import "@fullcalendar/react/themes/breezy/palettes/indigo.css";
import { Plus } from "lucide-react";
import { useState } from "react";
import { EventDialog, type EventDraft } from "@/components/calendar/EventDialog";
import { Button } from "@/components/ui/button";
import { todayStr, toDateStr } from "@/components/ui/format";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";

const COLORS = {
  ai: "oklch(0.62 0.15 285)", // 라벤더(보라): AI가 만든 일정
  manual: "oklch(0.66 0.12 175)", // 민트: 직접 추가한 일정
  cancelled: "oklch(0.8 0.01 285)", // 회색: 취소됨
};

export default function CalendarPage() {
  const ws = useWorkspace();
  const [showCancelled, setShowCancelled] = useState(false);
  const [draft, setDraft] = useState<EventDraft | null>(null);

  const events = ws.events
    .filter((e) => e.status !== "rejected" && (showCancelled || e.status !== "cancelled"))
    .map((e) => {
      const cancelled = e.status === "cancelled";
      return {
        id: String(e.id),
        title: `${e.source === "ai" ? "✨ " : ""}${e.title}${e.location ? ` · ${e.location}` : ""}`,
        start: e.start ? `${e.date}T${e.start}` : e.date,
        allDay: !e.start,
        color: cancelled ? COLORS.cancelled : COLORS[e.source],
        className: cancelled ? "line-through opacity-70" : "",
      };
    });

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl">📅 캘린더</h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <Legend color={COLORS.ai}>✨ AI가 찾은 일정</Legend>
          <Legend color={COLORS.manual}>직접 추가</Legend>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" className="accent-primary" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />
            취소된 일정도 보기
          </label>
        </div>
        <Button className="ml-auto rounded-xl" onClick={() => setDraft({ date: todayStr() })}>
          <Plus /> 일정 추가
        </Button>
      </header>

      <div className="calendar-wrap min-h-[560px] flex-1">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, breezyTheme]}
          locale={koLocale}
          initialView="dayGridMonth"
          headerToolbar={{ start: "prev,next today", center: "title", end: "dayGridMonth,timeGridWeek" }}
          height="100%"
          dayMaxEvents={3}
          eventDisplay="block"
          editable
          events={events}
          dateClick={(info) => {
            const timed = !info.allDay;
            setDraft({ date: toDateStr(info.date), start: timed ? info.dateStr.slice(11, 16) : undefined });
          }}
          eventClick={(info) => {
            const ev = ws.events.find((e) => String(e.id) === info.event.id);
            if (ev) setDraft({ event: ev, date: ev.date });
          }}
          eventDrop={async (info) => {
            const start = info.event.start;
            if (!start) return info.revert();
            const err = await ws.updateEvent(Number(info.event.id), {
              date: toDateStr(start),
              ...(info.event.allDay ? {} : { start: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}:00` }),
            });
            if (err) {
              info.revert();
              alert(err);
            }
          }}
        />
      </div>

      <EventDialog
        draft={draft}
        members={ws.members}
        onClose={() => setDraft(null)}
        onCreate={ws.createEvent}
        onUpdate={ws.updateEvent}
        onDelete={ws.deleteEvent}
      />
    </main>
  );
}

function Legend({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}

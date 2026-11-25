"use client";

// 캘린더 화면 (FullCalendar v7: 플러그인은 @fullcalendar/react/daygrid 처럼 하위 경로에서 가져와요)
//  - 날짜 누르기: 새 일정 / 일정 누르기: 수정·취소·삭제 / 끌어다 놓기: 날짜 옮기기
//  - AI가 찾은 일정은 노란 형광펜색, 직접 만든 일정은 파란색, 취소된 일정은 회색 (기본은 숨김)

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import koLocale from "@fullcalendar/react/locales/ko";
import breezyTheme from "@fullcalendar/react/themes/breezy";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/breezy/theme.css";
import "@fullcalendar/react/themes/breezy/palettes/indigo.css";
import { useState } from "react";
import { cn } from "cn";
import { TopBar, TopBarDivider, TopBarTitle } from "@/components/app/TopBar";
import { EventDialog, type EventDraft } from "@/components/calendar/EventDialog";
import { Button } from "@/components/ui/button";
import { IconAdd, IconCalendar } from "@/components/ui/icons";
import { todayStr, toDateStr } from "@/components/ui/format";
import { BackToChat } from "@/components/workspace/BackToChat";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";

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
        // 색은 이벤트 모양 클래스(eventClass)가 정해요. 여기서는 종류만 넘겨요.
        title: `${e.title}${e.location ? ` · ${e.location}` : ""}`,
        start: e.start ? `${e.date}T${e.start}` : e.date,
        allDay: !e.start,
        extendedProps: { kind: cancelled ? "cancelled" : e.source },
      };
    });

  // 색 설명 + 취소된 일정 보기. 넓은 화면은 위쪽 줄에, 좁은 화면은 달력 바로 위에 놓아요
  const legend = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <Legend swatch="bg-highlight">AI가 찾은 일정</Legend>
      <Legend swatch="border border-l-[3px] border-border border-l-primary bg-secondary">직접 추가</Legend>
      <label className="flex cursor-pointer items-center gap-1.5">
        <input type="checkbox" className="accent-primary dark:scheme-dark" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />
        취소된 일정도 보기
      </label>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar>
        <BackToChat />
        <TopBarDivider />
        <TopBarTitle icon={IconCalendar}>캘린더</TopBarTitle>
        <div className="hidden xl:block">{legend}</div>
        <Button className="ml-auto" onClick={() => setDraft({ date: todayStr() })}>
          <IconAdd /> 일정 추가
        </Button>
      </TopBar>

    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-4">
      <div className="mb-3 px-1 xl:hidden">{legend}</div>
      {/* 종이 카드 한 장: 테두리는 여기 한 번만 (FullCalendar 안쪽 테두리는 globals.css에서 지워요) */}
      <div className="calendar-wrap min-h-[32rem] flex-1 overflow-hidden rounded-xl border bg-card">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, breezyTheme]}
          locale={koLocale}
          initialView="dayGridMonth"
          headerToolbar={{ start: "prev,next today", center: "title", end: "dayGridMonth,timeGridWeek" }}
          height="100%"
          dayMaxEvents={3}
          eventDisplay="block"
          // 날짜 칸 구분: 주말·다른 달·오늘에 각각 다른 배경 (모양은 globals.css의 .cal-*)
          dayCellClass={(d) => cn(d.dow === 0 && "cal-sun", d.dow === 6 && "cal-sat", d.isOther && "cal-other", d.isToday && "cal-today")}
          dayHeaderClass={(d) => cn("cal-head", d.dow === 0 && "cal-sun", d.dow === 6 && "cal-sat")}
          // 주 보기 요일 칸: 오늘은 월 보기처럼 파란 칩. 칸이 아주 좁으면 요일만 나와서 그 아래에 날짜를 따로 적어요
          dayHeaderContent={(d) => {
            if (!d.dayNumberText || d.inPopover) return d.text; // 월 보기는 요일만, "더보기" 팝업 제목은 날짜 그대로
            const day = cn("tabular-nums", d.isToday && "cal-today-num");
            return d.text.includes(d.dayNumberText) ? (
              <span className={day}>{d.text}</span>
            ) : (
              <span className="flex flex-col items-center gap-0.5 py-1 text-xs">{d.text}<span className={cn("text-sm", day)}>{d.dayNumberText}</span></span>
            );
          }}
          // 오늘 날짜 숫자는 파란 칩 (칸 전체를 칠하지 않아요)
          dayCellTopInnerClass={(d) => cn("cal-daynum", d.isToday && "cal-today-num")}
          // 버튼: 선택된 보기(월/주)는 cal-btn-on
          buttonClass={(b) => cn("cal-btn", b.isSelected && "cal-btn-on")}
          buttonGroupClass="cal-btn-group"
          // "+N개 더보기" 팝업은 달력 바깥(body)에 그려져요. 같은 이름을 붙여야 일정 색이 똑같이 나와요
          popoverClass="calendar-wrap"
          toolbarClass="cal-toolbar"
          toolbarTitleClass="cal-title"
          // 일정 색: AI = 노랑, 직접 = 파랑, 취소 = 회색 + 취소선
          eventClass={(i) => cn("cal-ev", `cal-${(i.event.extendedProps as { kind: string }).kind}`)}
          eventTimeClass="cal-time tabular-nums"
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
              // 종일 칸으로 옮기면 옛 시간을 비워요 (null = 지우기)
              ...(info.event.allDay ? { start: null } : { start: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}:00` }),
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
    </div>
  );
}

function Legend({ swatch, children }: { swatch: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden className={`size-3 shrink-0 ${swatch}`} />
      {children}
    </span>
  );
}

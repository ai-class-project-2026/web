"use client";

import { useRef, useState } from "react";
import { cn } from "cn";
import type { Event, EventInput, Suggestion } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { DateLeaf } from "@/components/ui/date-leaf";
import { Field, Input } from "@/components/ui/field";
import { IconCheck, IconClose, IconEdit, IconEventAdd, IconMembers, IconNote, IconPlace, IconTime } from "@/components/ui/icons";
import { eulReul, hhmm, shortDate, timeLabel } from "@/components/ui/format";

type Action = "added" | "edited" | "ignored";

// AI 일정 카드. AI는 자동 등록하지 않고 항상 제안만 해요 (기획서 5.2).
//   kind "add":    [캘린더에 추가] [수정] [무시]
//   kind "update": "기존 일정을 이렇게 바꿀까요?"  [바꾸기] [수정] [무시]
//   kind "cancel": "11/19 팀 회의를 취소할까요?"  [취소하기] [무시]
// 누가 버튼을 누르면 서버가 다른 팀원 화면의 카드도 지워줘요 (useSuggestions).

const KIND = {
  add: { badge: "새 일정", question: "이 일정을 캘린더에 추가할까요?", ok: "캘린더에 추가", tone: "bg-highlight text-highlight-foreground" },
  update: { badge: "일정 변경", question: "기존 일정을 이렇게 바꿀까요?", ok: "이렇게 바꾸기", tone: "bg-highlight text-highlight-foreground" },
  cancel: { badge: "일정 취소", question: "", ok: "일정 취소하기", tone: "bg-destructive/10 text-destructive" },
} as const;

export function ScheduleCard({ suggestion, onAct, current, registered = false }: {
  suggestion: Suggestion;
  /** 내가 이미 등록한 카드: 버튼 대신 "등록됨"을 보여줘요 (기획서 6.1) */
  registered?: boolean;
  /** 결과로 에러 문구(string)를 돌려주면 카드에 보여줘요 */
  onAct: (action: Action, edited?: EventInput) => unknown;
  /** update/cancel일 때 바뀌기 전 일정 (있으면 비교해서 보여줘요) */
  current?: Event;
}) {
  const { kind, event } = suggestion.payload;
  const k = KIND[kind];
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const working = useRef(false); // 연타해도 한 번만 처리해요
  const run = async (action: Action, edited?: EventInput) => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError("");
    const res = await onAct(action, edited);
    working.current = false;
    setBusy(false);
    if (typeof res === "string" && res) setError(res);
  };

  const struck = kind === "cancel" && "line-through decoration-destructive decoration-2";
  const question = registered ? "" : kind === "cancel" ? `${shortDate(event.date, event.weekday)} ${event.title}${eulReul(event.title)} 취소할까요?` : k.question;

  // 플래너에서 뜯어낸 쪽지: 왼쪽 달력 한 장(노랑) | 점선(절취선) | 오른쪽 내용
  return (
    <div className={cn("mt-1 flex w-full overflow-hidden rounded-xl border bg-card text-chat", kind === "cancel" && "opacity-90")}>
      {!editing && <DateLeaf date={event.date} ai size="lg" className="card-leaf w-12 self-stretch rounded-none sm:w-16" />}
      <div className={cn("min-w-0 flex-1 p-3", !editing && "border-l border-dashed border-foreground/30")}>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className={cn("shrink-0 rounded-sm px-1.5 py-0.5 font-medium", k.tone)}>{k.badge}</span>
          {registered && (
            <span className="flex items-center gap-1 rounded-sm bg-secondary px-1.5 py-0.5 font-medium text-secondary-foreground">
              <IconCheck className="size-4" aria-hidden /> 등록됨
            </span>
          )}
          {question && <p className="min-w-0 break-words text-sm text-muted-foreground">{question}</p>}
        </div>

        {editing && !registered ? (
          <>
            <EditForm event={event} update={kind === "update"} busy={busy} onCancel={() => setEditing(false)} onSave={(e) => run("edited", e)} />
            {/* 고쳐서 추가하다 실패해도 이유가 보이게, 수정 중에도 에러를 보여줘요 */}
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          </>
        ) : (
          <>
            {current && kind === "update" && (
              <p className="mb-1.5 break-words text-sm text-muted-foreground line-through decoration-destructive decoration-1">
                <span className="tabular-nums">{shortDate(current.date)} {timeLabel(current)}</span> · {current.location ?? "장소 미정"} · {current.title}
              </p>
            )}
            <div className="text-sm">
              {/* 취소 카드는 제목과 날짜에만 빨간 줄을 그어요 (참석자까지 그으면 전부 불참처럼 보여요) */}
              <p className={cn("break-words text-chat font-semibold", struck)}>{event.title}</p>
              <p className={cn("mt-1 flex min-w-0 items-center gap-1.5 break-words tabular-nums", struck)}>
                <IconTime className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 break-words">{shortDate(event.date, event.weekday)} {timeLabel(event) || "시간 미정"}</span>
              </p>
              <ul className="mt-1 flex flex-col gap-1 text-muted-foreground">
                {event.location && <li className="flex min-w-0 items-center gap-1.5"><IconPlace className="size-4 shrink-0" /> <span className="min-w-0 break-words">{event.location}</span></li>}
                {(event.attendees.length > 0 || event.absent.length > 0) && (
                  <li className="flex min-w-0 items-start gap-1.5">
                    <IconMembers className="mt-0.5 size-4 shrink-0" />
                    <span className="flex min-w-0 flex-wrap gap-1">
                      {event.attendees.map((n) => <span key={n} className="min-w-0 break-words rounded-sm bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground">{n}</span>)}
                      {event.absent.map((n) => <span key={n} className="min-w-0 break-words rounded-sm bg-muted px-1.5 py-0.5 text-xs font-medium line-through" title="불참">{n}</span>)}
                    </span>
                  </li>
                )}
                {event.note && <li className="flex min-w-0 items-center gap-1.5"><IconNote className="size-4 shrink-0" /> <span className="min-w-0 break-words">{event.note}</span></li>}
              </ul>
            </div>

            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

            {!registered && <div className="mt-3 flex flex-wrap gap-2">
              <Button disabled={busy} onClick={() => run("added")} variant={kind === "cancel" ? "destructive" : "default"}>
                {kind === "cancel" ? <IconClose className="max-sm:hidden" /> : <IconEventAdd className="max-sm:hidden" />} {k.ok}
              </Button>
              {kind !== "cancel" && (
                <Button disabled={busy} variant="outline" onClick={() => setEditing(true)}>
                  <IconEdit className="max-sm:hidden" /> 수정
                </Button>
              )}
              <Button disabled={busy} variant="ghost" onClick={() => run("ignored")}>
                무시
              </Button>
            </div>}
          </>
        )}
      </div>
    </div>
  );
}

/** [수정]을 누르면 나오는 폼. 고친 값으로 onAct("edited", 고친값). 카드가 좁으면(휴대폰) 날짜와 시간을 한 줄씩 써요 */
function EditForm({ event, update, busy, onSave, onCancel }: {
  event: Suggestion["payload"]["event"];
  /** 일정 변경 카드면 버튼 글자가 "바꾸기" */
  update: boolean;
  busy: boolean;
  onSave: (e: EventInput) => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState({
    title: event.title,
    date: event.date,
    start: hhmm(event.start),
    location: event.location ?? "",
    attendees: event.attendees.join(", "),
    absent: event.absent.join(", "),
    note: event.note ?? "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  return (
    <form
      className="@container grid grid-cols-2 gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          title: f.title.trim() || event.title,
          date: f.date,
          start: f.start ? `${f.start}:00` : null,
          time_text: f.start ? null : event.time_text ?? null,
          location: f.location.trim() || null,
          attendees: list(f.attendees),
          absent: list(f.absent),
          note: f.note.trim() || null,
        });
      }}
    >
      <Field label="제목" className="col-span-2"><Input value={f.title} onChange={set("title")} required /></Field>
      <Field label="날짜" className="col-span-2 @xs:col-span-1"><Input type="date" value={f.date} onChange={set("date")} required /></Field>
      <Field label="시간" className="col-span-2 @xs:col-span-1"><Input type="time" value={f.start} onChange={set("start")} /></Field>
      <Field label="장소" className="col-span-2"><Input value={f.location} onChange={set("location")} placeholder="예: 디스코드" /></Field>
      <Field label="참석 (쉼표로 구분)" className="col-span-2"><Input value={f.attendees} onChange={set("attendees")} /></Field>
      <Field label="불참"><Input value={f.absent} onChange={set("absent")} /></Field>
      <Field label="메모"><Input value={f.note} onChange={set("note")} /></Field>
      <div className="col-span-2 mt-1 flex gap-2">
        <Button type="submit" disabled={busy}>{update ? "고친 내용으로 바꾸기" : "고친 내용으로 추가"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>돌아가기</Button>
      </div>
    </form>
  );
}

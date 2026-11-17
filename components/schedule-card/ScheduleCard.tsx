"use client";

import { CalendarPlus, Clock, MapPin, Pencil, Users, X } from "lucide-react";
import { useState } from "react";
import { cn } from "cn";
import type { Event, EventInput, Suggestion } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { hhmm, shortDate, timeLabel } from "@/components/ui/format";

type Action = "added" | "edited" | "ignored";

// AI 일정 카드. AI는 자동 등록하지 않고 항상 제안만 해요 (기획서 5.2).
//   kind "add":    [캘린더에 추가] [수정] [무시]
//   kind "update": "기존 일정을 이렇게 바꿀까요?"  [바꾸기] [수정] [무시]
//   kind "cancel": "11/19 팀 회의를 취소할까요?"  [취소하기] [무시]
// 누가 버튼을 누르면 서버가 다른 팀원 화면의 카드도 지워줘요 (useSuggestions).

const KIND = {
  add: { badge: "새 일정", question: "이 일정을 캘린더에 추가할까요?", ok: "캘린더에 추가", tone: "border-l-primary" },
  update: { badge: "일정 변경", question: "기존 일정을 이렇게 바꿀까요?", ok: "이렇게 바꾸기", tone: "border-l-chart-3" },
  cancel: { badge: "일정 취소", question: "", ok: "일정 취소하기", tone: "border-l-destructive" },
} as const;

export function ScheduleCard({ suggestion, onAct, current }: {
  suggestion: Suggestion;
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

  const run = async (action: Action, edited?: EventInput) => {
    setBusy(true);
    setError("");
    const res = await onAct(action, edited);
    setBusy(false);
    if (typeof res === "string" && res) setError(res);
  };

  const question = kind === "cancel" ? `${shortDate(event.date, event.weekday)} ${event.title}을(를) 취소할까요?` : k.question;

  return (
    <div className={cn("w-full rounded-2xl rounded-tl-md border border-l-4 bg-card p-4 shadow-sm", k.tone)}>
      <div className="mb-2 flex items-center gap-2 text-xs">
        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{k.badge}</span>
      </div>
      <p className="mb-3 font-heading text-lg leading-snug">{question}</p>

      {editing ? (
        <EditForm event={event} busy={busy} onCancel={() => setEditing(false)} onSave={(e) => run("edited", e)} />
      ) : (
        <>
          {current && kind === "update" && (
            <p className="mb-2 rounded-xl bg-muted px-3 py-1.5 text-xs text-muted-foreground line-through">
              기존: {shortDate(current.date)} {timeLabel(current)} · {current.location ?? "장소 미정"} · {current.title}
            </p>
          )}
          <div className={cn("rounded-xl bg-muted/60 p-3 text-sm", kind === "cancel" && "opacity-70")}>
            <p className="font-heading text-xl">
              {shortDate(event.date, event.weekday)} <span className="text-primary">{timeLabel(event) || "시간 미정"}</span>
            </p>
            <p className="mt-0.5 font-medium">{event.title}</p>
            <ul className="mt-2 flex flex-col gap-1 text-muted-foreground">
              {event.location && <li className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {event.location}</li>}
              {event.attendees.length > 0 && (
                <li className="flex items-start gap-1.5">
                  <Users className="mt-0.5 size-3.5 shrink-0" />
                  <span className="flex flex-wrap gap-1">
                    {event.attendees.map((n) => <span key={n} className="rounded-full bg-secondary px-2 text-secondary-foreground">{n}</span>)}
                    {event.absent.map((n) => <span key={n} className="rounded-full bg-muted px-2 line-through" title="불참">{n}</span>)}
                  </span>
                </li>
              )}
              {event.note && <li className="flex items-center gap-1.5"><Clock className="size-3.5" /> {event.note}</li>}
            </ul>
          </div>

          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => run("added")} className="rounded-xl" variant={kind === "cancel" ? "destructive" : "default"}>
              {kind === "cancel" ? <X /> : <CalendarPlus />} {k.ok}
            </Button>
            {kind !== "cancel" && (
              <Button disabled={busy} variant="outline" className="rounded-xl" onClick={() => setEditing(true)}>
                <Pencil /> 수정
              </Button>
            )}
            <Button disabled={busy} variant="ghost" className="rounded-xl" onClick={() => run("ignored")}>
              무시
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/** [수정]을 누르면 나오는 폼. 고친 값으로 onAct("edited", 고친값) */
function EditForm({ event, busy, onSave, onCancel }: {
  event: Suggestion["payload"]["event"];
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
      className="grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-3"
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
      <Field label="날짜"><Input type="date" value={f.date} onChange={set("date")} required /></Field>
      <Field label="시간"><Input type="time" value={f.start} onChange={set("start")} /></Field>
      <Field label="장소" className="col-span-2"><Input value={f.location} onChange={set("location")} placeholder="예: 디스코드" /></Field>
      <Field label="참석 (쉼표로 구분)" className="col-span-2"><Input value={f.attendees} onChange={set("attendees")} /></Field>
      <Field label="불참"><Input value={f.absent} onChange={set("absent")} /></Field>
      <Field label="메모"><Input value={f.note} onChange={set("note")} /></Field>
      <div className="col-span-2 mt-1 flex gap-2">
        <Button type="submit" disabled={busy} className="rounded-xl">고친 내용으로 추가</Button>
        <Button type="button" variant="ghost" className="rounded-xl" onClick={onCancel}>돌아가기</Button>
      </div>
    </form>
  );
}

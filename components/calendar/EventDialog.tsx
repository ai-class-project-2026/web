"use client";

// 캘린더에서 날짜나 일정을 누르면 뜨는 팝업. 새 일정 추가 / 기존 일정 수정·취소·삭제.

import { Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "cn";
import type { Event, EventInput, Member } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ErrorText, Field, Input } from "@/components/ui/field";
import { hhmm } from "@/components/ui/format";
import type { EventUpdate } from "@/components/workspace/WorkspaceProvider";

/** title: 채팅 메시지에서 일정을 만들 때 미리 채울 제목 */
export type EventDraft = { event?: Event; date: string; start?: string; title?: string };

export function EventDialog({ draft, members, onClose, onCreate, onUpdate, onDelete }: {
  draft: EventDraft | null;
  members: Member[];
  onClose: () => void;
  onCreate: (e: EventInput) => Promise<string | null>;
  onUpdate: (id: number, patch: EventUpdate) => Promise<string | null>;
  onDelete: (id: number) => Promise<string | null>;
}) {
  return (
    <Dialog open={!!draft} onClose={onClose} title={draft?.event ? "일정 보기" : "새 일정 ✏️"}>
      {/* key: 다른 일정을 열면 폼을 새로 채워요 */}
      {draft && (
        <EventForm
          key={draft.event?.id ?? `${draft.date}${draft.start}`}
          draft={draft}
          members={members}
          onClose={onClose}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </Dialog>
  );
}

function EventForm({ draft, members, onClose, onCreate, onUpdate, onDelete }: {
  draft: EventDraft;
  members: Member[];
  onClose: () => void;
  onCreate: (e: EventInput) => Promise<string | null>;
  onUpdate: (id: number, patch: EventUpdate) => Promise<string | null>;
  onDelete: (id: number) => Promise<string | null>;
}) {
  const ev = draft.event;
  const [title, setTitle] = useState(ev?.title ?? draft.title ?? "");
  const [date, setDate] = useState(ev?.date ?? draft.date);
  const [start, setStart] = useState(ev ? hhmm(ev.start) : draft.start ?? "");
  const [location, setLocation] = useState(ev?.location ?? "");
  const [note, setNote] = useState(ev?.note ?? "");
  const [attendees, setAttendees] = useState<string[]>(ev?.attendees ?? members.map((m) => m.name));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const cancelled = ev?.status === "cancelled";

  const done = async (p: Promise<string | null>) => {
    setBusy(true);
    const err = await p;
    setBusy(false);
    if (err) setError(err);
    else onClose();
  };

  const body = {
    title: title.trim(),
    date,
    start: start ? `${start}:00` : null,
    time_text: start ? null : ev?.time_text ?? null,
    location: location.trim() || null,
    attendees,
    absent: ev?.absent.filter((n) => !attendees.includes(n)) ?? [],
    note: note.trim() || null,
  };

  const toggle = (name: string) =>
    setAttendees((a) => (a.includes(name) ? a.filter((x) => x !== name) : [...a, name]));

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.title) return setError("제목을 적어 주세요");
        done(ev ? onUpdate(ev.id, body) : onCreate(body));
      }}
    >
      {ev && (
        <div className="flex flex-wrap gap-1.5 text-xs">
          {ev.source === "ai" && (
            <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
              <Sparkles className="size-3" /> AI가 대화에서 찾은 일정
            </span>
          )}
          {cancelled && <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">취소된 일정</span>}
        </div>
      )}

      <Field label="제목">
        <Input autoFocus={!ev} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 팀 회의" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="날짜"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></Field>
        <Field label="시간" hint={!start && ev?.time_text ? `원래 표현: ${ev.time_text}` : "비우면 하루 종일"}>
          <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
      </div>
      <Field label="장소"><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="예: 디스코드, 도서관 3층" /></Field>

      {members.length > 0 && (
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground/80">참석자</span>
          <div className="flex flex-wrap gap-1.5">
            {members.map((m) => {
              const on = attendees.includes(m.name);
              return (
                <button
                  type="button"
                  key={m.user_id}
                  onClick={() => toggle(m.name)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition",
                    on ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground line-through hover:bg-muted",
                  )}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Field label="메모"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="예: 지호 10분 늦게 합류" /></Field>

      <ErrorText>{error}</ErrorText>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={busy} className="rounded-xl">{ev ? "저장" : "추가하기"}</Button>
        {ev && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            className="rounded-xl"
            onClick={() => done(onUpdate(ev.id, { status: cancelled ? "confirmed" : "cancelled" }))}
          >
            {cancelled ? "다시 살리기" : "일정 취소"}
          </Button>
        )}
        {ev && (
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            className="ml-auto rounded-xl"
            onClick={() => confirm("이 일정을 완전히 지울까요?") && done(onDelete(ev.id))}
          >
            <Trash2 /> 삭제
          </Button>
        )}
      </div>
    </form>
  );
}

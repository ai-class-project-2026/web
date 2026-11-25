"use client";

// 캘린더에서 날짜나 일정을 누르면 뜨는 팝업. 새 일정 추가 / 기존 일정 수정·취소·삭제.

import { useRef, useState } from "react";
import { cn } from "cn";
import type { Event, EventInput, Member } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ErrorText, Field, Input } from "@/components/ui/field";
import { hhmm } from "@/components/ui/format";
import { IconAI, IconDelete } from "@/components/ui/icons";
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
    <Dialog open={!!draft} onClose={onClose} title={draft?.event ? "일정 보기" : "새 일정"}>
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

  const working = useRef(false); // 더블클릭으로 두 번 저장되지 않게
  const done = async (run: () => Promise<string | null>) => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    const err = await run();
    working.current = false;
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

  // 수정할 때는 내가 바꾼 칸만 보내요. 다 보내면, 그 사이 팀원이 고친 다른 칸을
  // 이 창이 열릴 때의 옛 값(비어 있던 값 포함)으로 덮어써 버려요.
  const changes = (): EventUpdate => {
    if (!ev) return body;
    const patch: EventUpdate = {};
    if (body.title !== ev.title) patch.title = body.title;
    if (body.date !== ev.date) patch.date = body.date;
    if (start !== hhmm(ev.start)) {
      patch.start = body.start;
      if (start && ev.time_text) patch.time_text = null; // 시각을 정하면 "저녁쯤" 같은 원래 표현은 비워요
    }
    if (body.location !== (ev.location ?? null)) patch.location = body.location;
    if (body.note !== (ev.note ?? null)) patch.note = body.note;
    if (JSON.stringify([...attendees].sort()) !== JSON.stringify([...ev.attendees].sort())) {
      patch.attendees = attendees;
      if (JSON.stringify(body.absent) !== JSON.stringify(ev.absent)) patch.absent = body.absent;
    }
    return patch;
  };

  const toggle = (name: string) =>
    setAttendees((a) => (a.includes(name) ? a.filter((x) => x !== name) : [...a, name]));

  return (
    <form
      className="grid grid-cols-2 gap-x-3 gap-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.title) return setError("제목을 적어 주세요");
        if (!ev) return done(() => onCreate(body));
        const patch = changes();
        done(async () => (Object.keys(patch).length ? onUpdate(ev.id, patch) : null)); // 바뀐 게 없으면 요청 없이 닫아요
      }}
    >
      {ev && (
        <div className="col-span-2 flex flex-wrap gap-1.5 text-xs">
          {ev.source === "ai" && (
            <span className="flex items-center gap-1">
              <IconAI className="size-4" /> <span className="hl font-medium">AI가 대화에서 찾은 일정</span>
            </span>
          )}
          {cancelled && <span className="rounded-sm bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">취소된 일정</span>}
        </div>
      )}

      <Field label="제목" className="col-span-2">
        <Input autoFocus={!ev} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 팀 회의" />
      </Field>
      <Field label="날짜" className="col-span-2 sm:col-span-1"><Input type="date" className="tabular-nums" value={date} onChange={(e) => setDate(e.target.value)} required /></Field>
      <Field label="시간" className="col-span-2 sm:col-span-1" hint={!start && ev?.time_text ? `원래 표현: ${ev.time_text}` : "비우면 하루 종일"}>
        <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="tabular-nums" />
      </Field>
      <Field label="장소" className="col-span-2"><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="예: 디스코드, 도서관 3층" /></Field>

      {members.length > 0 && (
        <div className="col-span-2 flex flex-col gap-1.5 text-sm">
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
                    "h-8 max-w-full truncate rounded-md border px-3 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                    on ? "border-primary bg-secondary text-secondary-foreground" : "text-muted-foreground line-through hover:bg-muted",
                  )}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Field label="메모" className="col-span-2"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="예: 지호 10분 늦게 합류" /></Field>

      <div className="col-span-2 empty:hidden"><ErrorText>{error}</ErrorText></div>

      <div className="col-span-2 mt-2 flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={busy}>{ev ? "저장" : "추가하기"}</Button>
        {ev && (
          <Button
            type="button"
            variant={cancelled ? "outline" : "destructive"}
            disabled={busy}
            onClick={() => done(() => onUpdate(ev.id, { status: cancelled ? "confirmed" : "cancelled" }))}
          >
            {cancelled ? "다시 살리기" : "일정 취소"}
          </Button>
        )}
        {ev && (
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            className="ml-auto"
            onClick={() => confirm("이 일정을 완전히 지울까요?") && done(() => onDelete(ev.id))}
          >
            <IconDelete /> 삭제
          </Button>
        )}
      </div>
    </form>
  );
}

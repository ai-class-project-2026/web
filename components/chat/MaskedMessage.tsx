"use client";

import { useRef, useState } from "react";
import type { Message, Workspace } from "@/lib/api";
import { IconHidden, IconNotify, IconWarning } from "@/components/ui/icons";
import { splitSpans, spansAreValid } from "@/lib/mask";

export type ReportType = "false_positive" | "missed";
/** 신고 보내기. 실패하면 에러 문구, 성공하면 null */
export type ReportFn = (messageId: number, type: ReportType) => Promise<string | null>;

// 욕설 가림 (기획서 파트 2 가이드 "욕설 가림 메시지")
//  - mask:         욕 부분만 검은 줄(.redact)로 가리고 [보기]를 누르면 원문
//  - warn:         원문은 보여주고 경고만 표시
//  - notify_admin: mask처럼 가리고, 방장(owner) 화면에는 "관리자 알림" 표시
// is_profane인데 profanity_spans가 비어 있거나, 하나라도 이상하면(범위 밖, 거꾸로, 빈 구간, null) 메시지 전체를 가려요.

export function MaskedMessage({ message, mode = "mask", isOwner = false, mine = false, onReport }: {
  message: Message;
  mode?: Workspace["filter_mode"];
  isOwner?: boolean;
  /** 내가 보낸 메시지면 글자색을 파란 계열로 맞춰요 */
  mine?: boolean;
  onReport?: ReportFn;
}) {
  const [shown, setShown] = useState(false);
  const [reported, setReported] = useState(false);
  const sending = useRef(false); // 연타해도 신고가 한 번만 가게 (state는 다음 화면 갱신에야 바뀌어서 ref로 막아요)

  if (!message.is_profane) return <span className="whitespace-pre-wrap break-words">{message.text}</span>;

  const warnOnly = mode === "warn";
  const whole = !spansAreValid(message.text, message.profanity_spans);
  const reveal = warnOnly || shown;

  const report = async () => {
    if (sending.current) return;
    sending.current = true;
    try {
      const err = await onReport?.(message.id, "false_positive");
      if (err) alert(err);
      else setReported(true);
    } finally {
      sending.current = false;
    }
  };

  return (
    <span className="flex flex-col gap-1">
      <span className="whitespace-pre-wrap break-words">
        {reveal ? (
          message.text
        ) : whole ? (
          <span className="inline-flex flex-wrap items-center gap-2">
            <span aria-hidden className="redact inline-block h-[1em] w-40 max-w-full align-middle" />
            <span className="text-muted-foreground">(가려진 메시지)</span>
          </span>
        ) : (
          splitSpans(message.text, message.profanity_spans).map((p, i) =>
            p.hidden ? <span key={i} className="redact">{"▮".repeat(Math.min(Math.max(p.text.length, 2), 6))}</span> : <span key={i}>{p.text}</span>,
          )
        )}
      </span>

      {/* cn에 넣으면 text-meta(글자 크기)를 글자색으로 알고 지워 버려서, 여기는 문자열로 이어 붙여요 */}
      <span className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-meta ${mine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
        {warnOnly ? <span className="inline-flex items-center gap-1 text-destructive"><IconWarning className="size-4" /> 부적절한 표현이 있어요</span> : <span className="inline-flex items-center gap-1"><IconHidden className="size-4" /> 부적절한 표현이 가려졌어요</span>}
        {!warnOnly && (
          <button className="-mx-1 -my-1.5 rounded-sm px-1 py-1.5 font-medium text-primary underline underline-offset-2" onClick={() => setShown((s) => !s)}>
            {shown ? "숨기기" : "보기"}
          </button>
        )}
        {mode === "notify_admin" && isOwner && (
          <span className="inline-flex items-center gap-1 rounded-sm bg-secondary px-1.5 py-0.5 font-medium text-secondary-foreground"><IconNotify className="size-4" /> 관리자 알림</span>
        )}
        {onReport &&
          (reported ? (
            <span>신고 접수됐어요</span>
          ) : (
            <button className="-mx-1 -my-1.5 rounded-sm px-1 py-1.5 underline underline-offset-2 hover:text-foreground" onClick={report} title="멀쩡한 말인데 가려졌다면 알려 주세요">
              욕설 아님
            </button>
          ))}
      </span>
    </span>
  );
}

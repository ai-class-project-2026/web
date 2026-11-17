"use client";

import { useState } from "react";
import { cn } from "cn";
import type { Message, Workspace } from "@/lib/api";
import { splitSpans } from "@/lib/mask";

export type ReportType = "false_positive" | "missed";
/** 신고 보내기. 실패하면 에러 문구, 성공하면 null */
export type ReportFn = (messageId: number, type: ReportType) => Promise<string | null>;

// 욕설 가림 (기획서 파트 2 가이드 "욕설 가림 메시지")
//  - mask:         욕 부분만 ●●로 가리고 [보기]를 누르면 원문
//  - warn:         원문은 보여주고 경고만 표시
//  - notify_admin: mask처럼 가리고, 방장(owner) 화면에는 "관리자 알림" 표시
// is_profane인데 profanity_spans가 비어 있으면(AI 모델이 잡은 경우) 메시지 전체를 가려요.

export function MaskedMessage({ message, mode = "mask", isOwner = false, mine = false, onReport }: {
  message: Message;
  mode?: Workspace["filter_mode"];
  isOwner?: boolean;
  /** 내가 보낸 메시지면 말풍선 색이 진해서 글자색을 맞춰요 */
  mine?: boolean;
  onReport?: ReportFn;
}) {
  const [shown, setShown] = useState(false);
  const [reported, setReported] = useState(false);

  if (!message.is_profane) return <span className="whitespace-pre-wrap break-words">{message.text}</span>;

  const warnOnly = mode === "warn";
  const whole = message.profanity_spans.length === 0;
  const reveal = warnOnly || shown;

  const report = async () => {
    const err = await onReport?.(message.id, "false_positive");
    if (err) alert(err);
    else setReported(true);
  };

  const chip = cn("rounded-md px-1 tracking-tighter", mine ? "bg-white/25" : "bg-foreground/10");

  return (
    <span className="flex flex-col gap-1">
      <span className="whitespace-pre-wrap break-words">
        {reveal ? (
          message.text
        ) : whole ? (
          <span className={cn("italic opacity-70")}>●●●●● (가려진 메시지)</span>
        ) : (
          splitSpans(message.text, message.profanity_spans).map((p, i) =>
            p.hidden ? <span key={i} className={chip}>{"●".repeat(Math.min(Math.max(p.text.length, 2), 4))}</span> : <span key={i}>{p.text}</span>,
          )
        )}
      </span>

      <span className={cn("flex flex-wrap items-center gap-x-2 gap-y-0.5 text-meta", mine ? "text-primary-foreground/80" : "text-muted-foreground")}>
        {warnOnly ? <span>⚠️ 부적절한 표현이 있어요</span> : <span>🙈 부적절한 표현이 가려졌어요</span>}
        {!warnOnly && (
          <button className="font-medium underline underline-offset-2" onClick={() => setShown((s) => !s)}>
            {shown ? "숨기기" : "보기"}
          </button>
        )}
        {mode === "notify_admin" && isOwner && (
          <span className={cn("rounded-full px-1.5 py-px", mine ? "bg-white/20" : "bg-butter")}>🔔 관리자 알림</span>
        )}
        {onReport &&
          (reported ? (
            <span>신고 접수됐어요 🙏</span>
          ) : (
            <button className="underline underline-offset-2" onClick={report} title="멀쩡한 말인데 가려졌다면 알려 주세요">
              욕설 아님
            </button>
          ))}
      </span>
    </span>
  );
}

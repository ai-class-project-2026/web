"use client";

import { SendHorizonal } from "lucide-react";
import { useRef, useState } from "react";

// Enter로 전송, Shift+Enter로 줄바꿈. 한글 조합 중(isComposing)에는 Enter를 무시해야
// 마지막 글자가 두 번 보내지는 문제가 안 생겨요.

// leading: 입력창 왼쪽에 붙는 빠른 버튼 자리 (예: 📅 일정 추가). 손이 이미 입력창 근처에 있으니 멀리 안 가도 돼요.

export function MessageInput({ onSend, placeholder = "메시지를 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)", leading, disabled }: {
  /** 결과에 ok: false가 오면 입력했던 글을 되살려요 */
  onSend: (text: string) => unknown;
  placeholder?: string;
  leading?: React.ReactNode;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = async () => {
    const t = text.trim();
    if (!t || disabled) return;
    setText("");
    setError("");
    resize(ref.current, true);
    const res = (await onSend(t)) as { ok?: boolean } | undefined;
    if (res && res.ok === false) {
      setText(t);
      setError("전송하지 못했어요. 다시 시도해 주세요");
    }
  };

  return (
    <form
      className="border-t bg-background/80 p-3 backdrop-blur"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      <div className={`flex items-end gap-2 rounded-2xl border bg-card p-1.5 pl-3 shadow-sm transition focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15 ${disabled ? "opacity-60" : ""}`}>
        {leading}
        <textarea
          disabled={disabled}
          ref={ref}
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            resize(e.target);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className="max-h-40 min-h-9 flex-1 resize-none disabled:cursor-not-allowed bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground/70"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          aria-label="보내기"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/85 disabled:opacity-40"
        >
          <SendHorizonal className="size-4" />
        </button>
      </div>
    </form>
  );
}

/** 글이 길어지면 입력창도 같이 커지게 (최대 max-h-40) */
function resize(el: HTMLTextAreaElement | null, reset = false) {
  if (!el) return;
  el.style.height = "auto";
  if (!reset) el.style.height = `${el.scrollHeight}px`;
}

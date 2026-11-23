"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { errorText } from "@/components/ui/format";
import { IconSend } from "@/components/ui/icons";
import { newClientId } from "@/lib/ws";

// Enter로 전송, Shift+Enter로 줄바꿈. 한글 조합 중(isComposing)에는 Enter를 무시해야
// 마지막 글자가 두 번 보내지는 문제가 안 생겨요.

// leading: 입력창 왼쪽에 붙는 빠른 버튼 자리 (예: 일정 추가). 손이 이미 입력창 근처에 있으니 멀리 안 가도 돼요.

// 채널(draftKey)마다 쓰던 글을 기억해 둬요. 채널을 옮겨도, 전송이 실패한 뒤에 옮겨도 글이 사라지지 않아요.
const drafts = new Map<string, string>();
// 실패한 글을 다시 보낼 때 같은 번호(client_id)를 써서 서버에 두 번 저장되지 않게 해요
const attempts = new Map<string, { text: string; id: string }>();

export function MessageInput({ onSend, placeholder = "메시지를 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)", leading, disabled, draftKey = "" }: {
  /** 결과에 ok: false가 오면 입력했던 글을 되살려요. clientId는 다시 보내도 같은 글이면 같은 값이에요 */
  onSend: (text: string, clientId: string) => unknown;
  placeholder?: string;
  leading?: React.ReactNode;
  disabled?: boolean;
  /** 채널 번호처럼 "어디에 쓰는 글인지" 구분하는 값 */
  draftKey?: string | number;
}) {
  const key = String(draftKey);
  const [text, setText] = useState(() => drafts.get(key) ?? "");
  const [error, setError] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const keyRef = useRef(key);
  useEffect(() => {
    keyRef.current = key;
    return () => {
      keyRef.current = "gone-left"; // 화면을 떠난 뒤에는 입력창을 건드리지 않아요
    };
  }, [key]);
  const change = (v: string) => {
    setText(v);
    if (v) drafts.set(key, v);
    else drafts.delete(key);
  };

  // 글이 바뀌면(되살린 글 포함) 입력창 높이도 맞춰요
  useLayoutEffect(() => resize(ref.current), [text]);

  const submit = async () => {
    const t = text.trim();
    if (!t || disabled) return;
    const sentKey = key;
    // 같은 글을 다시 보내는 거면 처음 번호를 그대로 써요
    const prev = attempts.get(sentKey);
    const attempt = prev && prev.text === t ? prev : { text: t, id: newClientId() };
    attempts.set(sentKey, attempt);
    setText("");
    drafts.delete(sentKey);
    setError("");
    resize(ref.current, true);
    // 실패(결과 ok:false, 또는 예외)하면 쓰던 글을 되살리고 이유를 보여줘요
    let failed: string | null = null;
    try {
      const res = (await onSend(t, attempt.id)) as { ok?: boolean; error?: unknown } | undefined;
      if (res && res.ok === false) failed = errorText(res.error, "전송하지 못했어요. 다시 시도해 주세요");
    } catch {
      failed = "전송하지 못했어요. 서버 연결을 확인해 주세요";
    }
    if (!failed) {
      attempts.delete(sentKey);
      return;
    }
    // 그 사이에 새로 쓴 글이 있으면 지우지 않고, 실패한 글을 앞에 붙여요.
    // 채널을 옮긴 뒤라도 그 채널의 임시 저장에 남겨서, 돌아오면 그대로 있어요.
    const cur = drafts.get(sentKey) ?? "";
    const merged = cur ? t + "\n" + cur : t;
    drafts.set(sentKey, merged);
    if (keyRef.current === sentKey) {
      setText(merged);
      setError(failed);
    }
  };

  return (
    <form
      className="shrink-0 px-2 pb-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      <div className={`flex min-h-14 items-end gap-2 rounded-md border border-input bg-card p-2.5 pl-2 transition-colors focus-within:border-primary ${disabled ? "opacity-60" : ""}`}>
        {leading}
        <textarea
          disabled={disabled}
          ref={ref}
          rows={1}
          value={text}
          onChange={(e) => {
            change(e.target.value);
            resize(e.target);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-1 py-1.5 text-chat outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          aria-label="보내기"
          className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
        >
          <IconSend className="size-5" />
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

"use client";

import { useState } from "react";

// TODO(part 2): 디자인, Enter로 전송(한글 조합 중에는 막기: e.nativeEvent.isComposing).

export function MessageInput({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <form
      className="border-t p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) onSend(text);
        setText("");
      }}
    >
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="메시지 입력" />
    </form>
  );
}

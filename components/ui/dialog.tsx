"use client";

import { IconClose } from "./icons";
import { useEffect } from "react";

/** 화면 가운데 뜨는 팝업. 바깥을 누르거나 Esc를 누르면 닫혀요. 화면보다 길면 팝업 안에서 스크롤해요. */
export function Dialog({ open, onClose, title, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal aria-label={title} className="animate-pop max-h-full w-full max-w-md overflow-y-auto rounded-xl border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="닫기" className="rounded-md p-1 text-muted-foreground hover:bg-foreground/5">
            <IconClose className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

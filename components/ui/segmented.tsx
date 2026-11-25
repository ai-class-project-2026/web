"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "cn";
import type { AppIcon } from "@/components/ui/icons";

/** 여러 보기 중 하나를 고르는 스위치 줄. 홈 화면, 설정, 할 일 등 어디서나 같은 모양이 나와요 */
export function Segmented<T extends string | number>({ value, onChange, options, fill, disabled, className }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: AppIcon }[];
  /** true면 버튼들이 줄 전체를 똑같은 너비로 나눠 가져요 */
  fill?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  // 선택 표시(흰 칸)가 누르기 직전 자리에서 새 자리로 미끄러져요.
  // 움직이는 도중에 또 눌러도 그때 보이던 자리에서 이어져요. 키보드로 바꾸면 바로 바뀌어요.
  const thumb = useRef<HTMLSpanElement>(null);
  const from = useRef<DOMRect | null>(null);
  useLayoutEffect(() => {
    const a = from.current;
    const el = thumb.current;
    from.current = null;
    if (!a || !el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const b = el.getBoundingClientRect();
    el.animate(
      [{ transform: `translateX(${a.left - b.left}px) scaleX(${a.width / b.width})` }, { transform: "none" }],
      { duration: 200, easing: getComputedStyle(el).getPropertyValue("--ease-out") || "ease-out" },
    );
  }, [value]);

  return (
    <div className={cn("isolate flex gap-0.5 rounded-md bg-muted p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          disabled={disabled}
          onClick={(e) => {
            from.current = e.detail ? (thumb.current?.getBoundingClientRect() ?? null) : null; // detail 0 = 키보드
            onChange(o.value);
          }}
          className={cn(
            "relative flex h-7 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md px-3 text-sm transition-colors disabled:cursor-not-allowed",
            fill && "flex-1",
            value === o.value ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {value === o.value && <span ref={thumb} aria-hidden className="absolute inset-0 -z-10 origin-left rounded-md border bg-card" />}
          {o.icon && <o.icon className="size-4" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

import { cn } from "cn";
import type { ComponentProps } from "react";

// 입력창 모양을 한 곳에서 관리해요. 모든 폼에서 같은 모양이 나와요.
const base =
  "w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-3 focus:ring-primary/15 disabled:opacity-60";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(base, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(base, "pr-8", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(base, "resize-none", className)} {...props} />;
}

/** 라벨 + 입력창 한 묶음 */
export function Field({ label, hint, children, className }: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm", className)}>
      <span className="font-medium text-foreground/80">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

/** 빨간 안내 문구 (에러가 없으면 아무것도 안 그림) */
export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{children}</p>;
}

import { cn } from "cn";
import { pastel } from "./format";

/** 이름 첫 글자가 들어간 동그란 아바타 (동그라미 = 사람). 색은 사람마다 고정 */
export function Avatar({ id, name, className }: { id: number; name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-9 shrink-0 select-none items-center justify-center rounded-full text-sm font-semibold text-foreground/80",
        pastel(id),
        className,
      )}
    >
      {name.slice(0, 1)}
    </span>
  );
}

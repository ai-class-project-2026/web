import { cn } from "cn";
import { parseDate, weekdayOf } from "./format";

/** 뜯어낸 달력 한 장: 월(작게) / 날짜 숫자(크게) / 요일. ai면 형광펜 노랑, 아니면 파란 옅은색 */
export function DateLeaf({ date, ai, size = "sm", className }: {
  /** "YYYY-MM-DD" */
  date: string;
  ai?: boolean;
  size?: "sm" | "lg";
  className?: string;
}) {
  const d = parseDate(date);
  const lg = size === "lg";
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-md leading-none",
        lg ? "w-16 gap-1 px-2 py-3" : "w-11 gap-0.5 px-1 py-1.5",
        ai ? "bg-highlight text-highlight-foreground" : "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      <span className="font-mono text-xs tabular-nums">{d.getMonth() + 1}월</span>
      <span className={cn("font-heading font-bold tabular-nums", lg ? "text-3xl" : "text-lg")}>{d.getDate()}</span>
      <span className="text-xs">{weekdayOf(date)}</span>
    </div>
  );
}

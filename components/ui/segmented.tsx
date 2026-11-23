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
  return (
    <div className={cn("flex gap-0.5 rounded-md bg-muted p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex h-7 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-3 text-sm transition disabled:cursor-not-allowed",
            fill && "flex-1",
            value === o.value ? "border-border bg-card font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {o.icon && <o.icon className="size-4" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

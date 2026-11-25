import { cn } from "cn";

// 종이처럼 흰 칸. 제목 줄 아래에 선 하나로 칸을 나눠요 (회색 띠 없음).
// 할 일·설정·마이페이지처럼 여러 묶음이 있는 화면에서 같은 모양으로 써요.

export function Panel({ title, desc, action, children, className, bodyClassName, danger }: {
  title: React.ReactNode;
  /** 제목 띠 아래 한 줄 설명 */
  desc?: React.ReactNode;
  /** 제목 띠 오른쪽 끝 (버튼, 개수 등) */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** 안쪽 여백을 바꾸고 싶을 때 (목록처럼 꽉 채울 땐 "p-0") */
  bodyClassName?: string;
  /** 회원 탈퇴처럼 조심해야 하는 칸은 빨간 테두리 */
  danger?: boolean;
}) {
  return (
    <section className={cn("overflow-hidden rounded-xl border bg-card", danger && "border-destructive/40", className)}>
      <header className="flex min-h-11 items-center gap-2 border-b px-4 py-2">
        <h2 className={cn("text-sm font-semibold", danger && "text-destructive")}>{title}</h2>
        {action && <div className="ml-auto flex items-center gap-2">{action}</div>}
      </header>
      {desc && <p className="break-keep px-4 pt-3 text-sm text-muted-foreground">{desc}</p>}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/** 책상색 바탕 + 넓은 화면에서 [본문 | 오른쪽 요약 20rem] 두 칸 */
export function PanelPage({ main, side }: { main: React.ReactNode; side?: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className={cn("mx-auto grid w-full max-w-6xl items-start gap-3 p-4", side && "lg:grid-cols-[minmax(0,1fr)_20rem]")}>
        <div className="flex min-w-0 flex-col gap-3">{main}</div>
        {side && <div className="flex min-w-0 flex-col gap-3">{side}</div>}
      </div>
    </div>
  );
}

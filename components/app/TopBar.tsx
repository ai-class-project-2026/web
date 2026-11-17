// 본문 맨 위 가로 줄. 모든 화면에서 같은 높이(48px)·같은 자리라
// "제목은 왼쪽, 이 화면에서 할 수 있는 버튼은 오른쪽"을 어디서나 똑같이 찾을 수 있어요.

import { cn } from "cn";

export function TopBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <header className={cn("flex h-12 shrink-0 items-center gap-3 border-b bg-background px-4", className)}>
      {children}
    </header>
  );
}

/** 상단 바 제목: 아이콘 + 굵은 글자 */
export function TopBarTitle({ icon: Icon, children }: { icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <h1 className="flex min-w-0 items-center gap-2 font-sans text-base font-semibold">
      {Icon && <Icon className="size-5 shrink-0 text-muted-foreground" />}
      <span className="truncate">{children}</span>
    </h1>
  );
}

/** 상단 바 안의 세로 구분선 */
export function TopBarDivider() {
  return <span aria-hidden className="h-6 w-px shrink-0 bg-border" />;
}

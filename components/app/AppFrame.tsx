"use client";

// 모든 로그인 후 화면의 공통 틀: [프로젝트 레일] [목록(채널 또는 1:1 대화)] [본문]
// 왼쪽에서 오른쪽으로 갈수록 "넓은 범위 → 좁은 범위" (프로젝트 → 채널 → 메시지) 순서라
// 마우스가 한 방향으로만 움직이면 원하는 곳에 도착해요.
// 휴대폰처럼 좁은 화면에서는 레일+목록이 서랍처럼 숨고 ☰ 버튼으로 열어요.

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "cn";
import { ProjectRail } from "./ProjectRail";

export function AppFrame({ demo, active, title, sidebar, children }: {
  demo: boolean;
  active: number | "dm" | null;
  /** 휴대폰 상단에 보일 제목 */
  title?: string;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  // 다른 화면으로 이동하면 (휴대폰에서 열어 둔) 서랍을 닫아요
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      {open && <div className="fixed inset-0 z-30 bg-foreground/20 md:hidden" onClick={() => setOpen(false)} />}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <ProjectRail demo={demo} active={active} />
        <aside className="relative flex w-76 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <button aria-label="메뉴 닫기" className="absolute right-2 top-2 z-10 rounded-md p-1.5 hover:bg-sidebar-accent md:hidden" onClick={() => setOpen(false)}>
            <X className="size-5" />
          </button>
          {sidebar}
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3 md:hidden">
          <button aria-label="메뉴 열기" className="rounded-lg p-1.5 hover:bg-muted" onClick={() => setOpen(true)}>
            <Menu className="size-5" />
          </button>
          <span className="truncate text-base font-semibold">{title}</span>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

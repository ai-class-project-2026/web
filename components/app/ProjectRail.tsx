"use client";

// 맨 왼쪽 세로 줄: [1:1 대화] / 내 프로젝트들 / [+ 새 프로젝트] / [AI 대시보드]
//
// 디자인 원칙
//  - 화면 맨 왼쪽 끝에 붙여 두면 마우스를 왼쪽으로 "던지기만" 해도 닿아요 (가장자리는 무한히 큰 버튼과 같음).
//  - 프로젝트는 둥근 네모 탭(동그라미는 사람 전용). 지금 있는 프로젝트는 파란 2px 테두리로 표시해요.
//  - 이름은 마우스를 올리면 바로 옆에 작은 이름표로. 탭에는 이름 앞 두 글자 + 프로젝트마다 고정된 인덱스 탭 색.

import { IconAdd, IconChat, IconDashboard } from "@/components/ui/icons";
import Link from "next/link";
import { cn } from "cn";
import { pastel } from "@/components/ui/format";
import { demoPath } from "@/lib/dummy";
import { useProjects } from "./useProjects";

export function ProjectRail({ demo, active }: {
  demo: boolean;
  /** 지금 보고 있는 것: 프로젝트 id, "dm"(1:1 대화) */
  active: number | "dm" | null;
}) {
  const { workspaces } = useProjects(demo);

  return (
    <nav aria-label="프로젝트" className="flex w-18 shrink-0 flex-col items-center gap-2 border-r border-sidebar-border bg-sidebar py-3">
      <RailItem href={demo ? "/dm/demo" : "/dm"} label="1:1 대화" active={active === "dm"} className="border bg-card text-primary">
        <IconChat className="size-6" />
      </RailItem>

      <span aria-hidden className="my-1 h-px w-8 shrink-0 bg-border" />

      {/* 프로젝트가 많아지면 이 칸만 위아래로 밀어서 봐요 (1:1 대화와 대시보드는 늘 제자리).
          스크롤 칸은 밖으로 나간 것을 잘라 버려서, 이름표가 잘리지 않게 칸을 오른쪽으로 넓혀 두고
          넓힌 부분은 마우스가 그냥 통과하게 했어요 (pointer-events-none) */}
      <div className="pointer-events-none -my-1 flex min-h-0 w-[calc(100%+15rem)] flex-1 flex-col gap-2 self-start overflow-y-auto py-1 pr-60 [scrollbar-width:none] *:pointer-events-auto [&::-webkit-scrollbar]:hidden">
        {workspaces.map((w) => (
          <RailItem
            key={w.id}
            href={demo ? demoPath(w.id) : `/w/${w.id}`}
            label={w.name}
            active={active === w.id}
            className={cn(pastel(w.id), "text-sm font-semibold text-foreground/80")}
          >
            {w.name.replace(/\s/g, "").slice(0, 2)}
          </RailItem>
        ))}

        <RailItem
          href="/onboarding"
          label={demo ? "새 프로젝트 (로그인 필요)" : "새 프로젝트 만들기 / 참가"}
          active={false}
          className="border border-dashed border-input bg-transparent text-muted-foreground hover:text-primary"
        >
          <IconAdd className="size-6" />
        </RailItem>
      </div>

      <RailItem href="/dashboard" label="AI 성능 대시보드" active={false} className="border bg-card text-muted-foreground">
        <IconDashboard className="size-6" />
      </RailItem>
    </nav>
  );
}

function RailItem({ href, label, active, className, children }: {
  href: string;
  label: string;
  active: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} aria-label={label} aria-current={active ? "page" : undefined} className="group relative flex w-full shrink-0 justify-center outline-none">
      {/* 키보드로 왔을 때(focus-visible)는 탭 모양을 따라 바깥에 한 줄 더 그려요 */}
      <span
        className={cn(
          "flex size-12 items-center justify-center overflow-hidden rounded-lg outline-2 outline-offset-0 transition-colors group-focus-visible:outline-ring group-focus-visible:outline-offset-2",
          active ? "outline-primary" : "outline-transparent",
          className,
        )}
      >
        {children}
      </span>
      {/* 이름표: 긴 이름은 여러 줄로 접어요 */}
      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-1 w-max max-w-56 -translate-y-1/2 wrap-anywhere break-keep rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-lg transition group-focus-visible:opacity-100 group-hover:opacity-100">
        {label}
      </span>
    </Link>
  );
}

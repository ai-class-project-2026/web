"use client";

// 맨 왼쪽 세로 줄: [1:1 대화] / 내 프로젝트들 / [+ 새 프로젝트] / [AI 대시보드]
//
// 디자인 원칙
//  - 화면 맨 왼쪽 끝에 붙여 두면 마우스를 왼쪽으로 "던지기만" 해도 닿아요 (가장자리는 무한히 큰 버튼과 같음).
//  - 지금 있는 프로젝트는 왼쪽 막대(길게) + 네모난 모서리, 마우스를 올리면 짧은 막대로 미리 알려줘요.
//  - 이름은 마우스를 올리면 바로 옆에 말풍선으로. 아이콘은 이름 앞 두 글자 + 프로젝트마다 고정된 파스텔 색.

import { BarChart3, MessageCircle, Plus } from "lucide-react";
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
    <nav aria-label="프로젝트" className="flex w-18 shrink-0 flex-col items-center gap-2 bg-secondary/70 py-3">
      <RailItem href={demo ? "/dm/demo" : "/dm"} label="1:1 대화" active={active === "dm"} className="bg-card text-primary">
        <MessageCircle className="size-6" />
      </RailItem>

      <span className="my-1 h-0.5 w-8 rounded-full bg-border" />

      {workspaces.map((w) => (
        <RailItem
          key={w.id}
          href={demo ? demoPath(w.id) : `/w/${w.id}`}
          label={w.name}
          active={active === w.id}
          className={cn(pastel(w.id), "font-heading text-base text-foreground/80")}
        >
          {w.name.replace(/\s/g, "").slice(0, 2)}
        </RailItem>
      ))}

      <RailItem
        href="/onboarding"
        label={demo ? "새 프로젝트 (로그인 필요)" : "새 프로젝트 만들기 / 참가"}
        active={false}
        className="border-2 border-dashed border-primary/40 bg-transparent text-primary"
      >
        <Plus className="size-6" />
      </RailItem>

      <div className="mt-auto">
        <RailItem href="/dashboard" label="AI 성능 대시보드" active={false} className="bg-card text-muted-foreground">
          <BarChart3 className="size-5" />
        </RailItem>
      </div>
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
    <Link href={href} aria-label={label} aria-current={active ? "page" : undefined} className="group relative flex w-full justify-center">
      {/* 왼쪽 표시 막대: 선택됨 = 길게, 마우스 올림 = 짧게 */}
      <span
        className={cn(
          "absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-all",
          active ? "h-9" : "h-0 group-hover:h-4",
        )}
      />
      <span
        className={cn(
          "flex size-12 items-center justify-center overflow-hidden rounded-[1.5rem] shadow-xs transition-all duration-200 group-hover:rounded-2xl",
          active && "rounded-2xl ring-2 ring-primary/50",
          className,
        )}
      >
        {children}
      </span>
      {/* 이름 말풍선 */}
      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-1 -translate-y-1/2 whitespace-nowrap rounded-xl bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-lg transition group-hover:opacity-100">
        {label}
      </span>
    </Link>
  );
}

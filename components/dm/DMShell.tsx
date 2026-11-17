"use client";

// 1:1 대화 화면의 뼈대: [프로젝트 레일] [대화 목록] [본문]
// 목록 맨 위에 "대화 찾기" 검색창을 둬서, 사람 이름만 치면 바로 대화로 갈 수 있어요.

import { Search, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppFrame } from "@/components/app/AppFrame";
import { UserPanel } from "@/components/app/UserPanel";
import { Avatar } from "@/components/ui/avatar";
import { clock } from "@/components/ui/format";
import { NavItem, SectionLabel, Splash } from "@/components/workspace/WorkspaceShell";
import { DMProvider, useDM } from "./DMProvider";

export function DMShell({ children }: { children: React.ReactNode }) {
  return (
    <DMProvider>
      <Frame>{children}</Frame>
    </DMProvider>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  const dm = useDM();
  if (dm.status === "loading") return <Splash>대화 목록을 불러오는 중…</Splash>;
  if (dm.status === "error") return <Splash emoji="🥲">{dm.errorMessage}</Splash>;
  return (
    <AppFrame demo={dm.demo} active="dm" title="1:1 대화" sidebar={<Sidebar />}>
      {children}
    </AppFrame>
  );
}

function Sidebar() {
  const dm = useDM();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const query = q.trim();
  const found = query ? dm.people.filter((p) => p.name.includes(query)) : [];
  const withThread = new Set(dm.threads.map((t) => t.peer.id));
  const others = dm.people.filter((p) => !withThread.has(p.id));

  return (
    <>
      <div className="border-b border-sidebar-border px-3 pb-3 pt-4">
        <p className="mb-2 px-1 pr-6 font-heading text-xl">1:1 대화</p>
        <label className="flex items-center gap-2 rounded-xl border border-input bg-card px-3 py-2 text-sm focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
          <Search className="size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름으로 대화 찾기" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/70" />
        </label>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2">
        {query ? (
          <>
            <SectionLabel>검색 결과</SectionLabel>
            {found.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">같은 프로젝트에 “{query}”님이 없어요</p>}
            {found.map((p) => <PersonLink key={p.id} id={p.id} name={p.name} sub={p.projects.map((w) => w.name).join(", ")} />)}
          </>
        ) : (
          <>
            <NavItem href={dm.homeHref} active={pathname === dm.homeHref} icon={Users}>팀원 전체 보기</NavItem>

            <SectionLabel>최근 대화</SectionLabel>
            {dm.threads.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                {dm.supported ? "아직 대화가 없어요" : "1:1 대화는 서버 준비 중이에요"}
              </p>
            )}
            {dm.threads.map((t) => (
              <PersonLink key={t.peer.id} id={t.peer.id} name={t.peer.name} sub={t.last.is_profane ? "🙈 가려진 메시지" : t.last.text} time={clock(t.last.created_at)} />
            ))}

            {others.length > 0 && <SectionLabel>팀원</SectionLabel>}
            {others.map((p) => <PersonLink key={p.id} id={p.id} name={p.name} sub={p.projects.map((w) => w.name).join(", ")} />)}
          </>
        )}
      </nav>

      <UserPanel me={dm.me} demo={dm.demo} />
    </>
  );
}

function PersonLink({ id, name, sub, time }: { id: number; name: string; sub: string; time?: string }) {
  const dm = useDM();
  const pathname = usePathname();
  const href = dm.peerHref(id);
  const active = pathname === href;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition ${active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60"}`}
    >
      <Avatar id={id} name={name} className="size-8 text-xs" />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={`truncate text-sm ${active ? "font-medium" : ""}`}>{name}</span>
          {time && <span className="shrink-0 text-[10px] text-muted-foreground">{time}</span>}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{sub}</span>
      </span>
    </Link>
  );
}

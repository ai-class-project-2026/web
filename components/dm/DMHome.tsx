"use client";

// 1:1 대화 첫 화면
//  [상단 바: 팀원 | 전체 · 프로젝트별 탭]
//  [검색창]
//  [팀원 목록: 한 줄에 한 사람, 줄 어디를 눌러도 대화로]      [오른쪽 칸: 최근 대화]

import { MessageCircle, Search, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "cn";
import { TopBar, TopBarDivider, TopBarTitle } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/avatar";
import { clock } from "@/components/ui/format";
import { useDM } from "./DMProvider";

export function DMHome() {
  const dm = useDM();
  const [tab, setTab] = useState<number | "all">("all");
  const [q, setQ] = useState("");

  // 탭: 전체 + 내가 참여한 프로젝트들 (팀원 목록에서 겹치지 않게 모아요)
  const projects = [...new Map(dm.people.flatMap((p) => p.projects).map((w) => [w.id, w])).values()];
  const query = q.trim();
  const list = dm.people
    .filter((p) => tab === "all" || p.projects.some((w) => w.id === tab))
    .filter((p) => !query || p.name.includes(query));
  const tabName = tab === "all" ? "전체" : projects.find((w) => w.id === tab)?.name;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar>
        <TopBarTitle icon={Users}>팀원</TopBarTitle>
        <TopBarDivider />
        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
          <Tab active={tab === "all"} onClick={() => setTab("all")}>전체</Tab>
          {projects.map((w) => (
            <Tab key={w.id} active={tab === w.id} onClick={() => setTab(w.id)}>{w.name}</Tab>
          ))}
        </nav>
      </TopBar>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto px-6 pt-4">
          {!dm.supported && (
            <p className="mb-3 rounded-md bg-muted px-4 py-2.5 text-sm">
              🛠️ 1:1 메시지 저장 기능은 서버(파트 1)에 준비 중이에요. 지금은 <Link href="/dm/demo" className="font-medium underline">데모</Link>에서 써 볼 수 있어요.
            </p>
          )}

          <label className="flex h-9 items-center gap-2 rounded-md border bg-card px-3 text-sm focus-within:ring-2 focus-within:ring-primary/30">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색하기" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
          </label>

          <p className="mb-2 mt-5 text-xs font-semibold text-muted-foreground">{tabName} — {list.length}명</p>

          {dm.people.length === 0 ? (
            <p className="rounded-md border border-dashed p-10 text-center text-muted-foreground">
              아직 같은 프로젝트에 있는 팀원이 없어요. 왼쪽 <b>+</b> 버튼으로 프로젝트를 만들고 초대해 보세요!
            </p>
          ) : list.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">“{query}”에 맞는 팀원이 없어요</p>
          ) : (
            <ul className="flex flex-col pb-6">
              {list.map((p) => (
                <li key={p.id} className="border-t first:border-t-0">
                  {/* 한 줄 전체가 대화로 가는 링크라 어디를 눌러도 돼요 */}
                  <Link href={dm.peerHref(p.id)} className="group -mx-2 flex h-16 items-center gap-3 rounded-md px-2 transition hover:bg-muted/70">
                    <Avatar id={p.id} name={p.name} className="size-10" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{p.name}</span>
                      <span className="block truncate text-sm text-muted-foreground">{p.projects.map((w) => w.name).join(" · ")}</span>
                    </span>
                    <span
                      title={`${p.name}님과 대화하기`}
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition group-hover:bg-card group-hover:text-primary"
                    >
                      <MessageCircle className="size-5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </main>

        <RecentPanel />
      </div>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-8 shrink-0 whitespace-nowrap rounded-md px-3 text-sm transition",
        active ? "bg-secondary font-medium text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** 오른쪽 칸: 최근 대화 (마지막 메시지 미리보기) */
function RecentPanel() {
  const dm = useDM();
  return (
    <aside className="hidden w-80 shrink-0 overflow-y-auto border-l px-4 py-4 xl:block">
      <h2 className="mb-3 font-sans text-base font-semibold">최근 대화</h2>
      {dm.threads.length === 0 ? (
        <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">아직 조용하네요</p>
          <p className="mt-1">왼쪽 목록에서 팀원을 골라 첫 대화를 시작해 보세요</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {dm.threads.slice(0, 6).map((t) => (
            <li key={t.peer.id}>
              <Link href={dm.peerHref(t.peer.id)} className="flex items-center gap-3 rounded-lg border bg-card p-3 transition hover:border-primary/30">
                <Avatar id={t.peer.id} name={t.peer.name} className="size-9" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{t.peer.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{clock(t.last.created_at)}</span>
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {t.last.is_profane ? "🙈 가려진 메시지" : t.last.text}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

"use client";

// 1:1 대화 첫 화면
//  [상단 바: 팀원 | 전체 · 프로젝트별 탭]
//  [검색창]
//  [팀원 목록: 한 줄에 한 사람, 줄 어디를 눌러도 대화로]      [오른쪽 칸: 최근 대화]

import Link from "next/link";
import { useState } from "react";
import { cn } from "cn";
import { Segmented } from "@/components/ui/segmented";
import { TopBar, TopBarDivider, TopBarTitle } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { IconChat, IconLock, IconMembers, IconSearch } from "@/components/ui/icons";
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
        <TopBarTitle icon={IconMembers}>팀원</TopBarTitle>
        <TopBarDivider />
        <Segmented className="min-w-0 overflow-x-auto" value={tab} onChange={setTab} options={[{ value: "all", label: "전체" }, ...projects.map((w) => ({ value: w.id, label: w.name }))]} />
      </TopBar>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto px-6 pt-4">
          {!dm.supported && (
            <p className="mb-3 flex items-center gap-2 rounded-md border bg-muted px-3 py-2.5 text-sm text-muted-foreground">
              <IconLock className="size-4 shrink-0" />
              <span>1:1 메시지 저장 기능은 서버(파트 1)에 준비 중이에요. 지금은 <Link href="/dm/demo" className="font-medium text-primary underline">데모</Link>에서 써 볼 수 있어요.</span>
            </p>
          )}

          <label className="flex h-9 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm focus-within:border-primary focus-within:ring-3 focus-within:ring-ring/30">
            <IconSearch className="size-4 shrink-0 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색하기" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
          </label>

          <p className="mb-2 mt-5 text-xs font-semibold text-muted-foreground">{tabName} <span className="tabular-nums">{list.length}</span>명</p>

          {dm.people.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
              <IconMembers className="size-6" />
              <p>아직 같은 프로젝트에 있는 팀원이 없어요. 왼쪽 <b>+</b> 버튼으로 프로젝트를 만들고 초대해 보세요</p>
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <IconSearch className="size-6" />
              <p>“{query}”에 맞는 팀원이 없어요</p>
            </div>
          ) : (
            <ul className="flex flex-col pb-6">
              {list.map((p) => (
                <li key={p.id} className="border-t first:border-t-0">
                  {/* 한 줄 전체가 대화로 가는 링크라 어디를 눌러도 돼요 */}
                  <Link href={dm.peerHref(p.id)} className="group -mx-2 flex h-16 items-center gap-3 rounded-md px-2 transition hover:bg-foreground/5">
                    <Avatar id={p.id} className="size-10" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{p.name}</span>
                      <span className="block truncate text-sm text-muted-foreground">{p.projects.map((w) => w.name).join(" · ")}</span>
                    </span>
                    <span
                      title={`${p.name}님과 대화하기`}
                      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-muted-foreground group-hover:text-primary")}
                    >
                      <IconChat className="size-5" />
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

/** 오른쪽 칸: 최근 대화 (마지막 메시지 미리보기) */
function RecentPanel() {
  const dm = useDM();
  return (
    <aside className="hidden w-80 shrink-0 overflow-y-auto border-l px-4 py-4 xl:block">
      <h2 className="mb-3 text-sm font-semibold">최근 대화</h2>
      {dm.threads.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
          <IconChat className="size-6" />
          <p className="font-medium text-foreground">아직 조용하네요</p>
          <p className="mt-1">왼쪽 목록에서 팀원을 골라 첫 대화를 시작해 보세요</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {dm.threads.slice(0, 6).map((t) => (
            <li key={t.peer.id}>
              <Link href={dm.peerHref(t.peer.id)} className="flex items-center gap-3 rounded-xl border bg-card p-3 transition hover:bg-secondary">
                <Avatar id={t.peer.id} className="size-9" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{t.peer.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{clock(t.last.created_at)}</span>
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {t.last.is_profane ? "가려진 메시지" : t.last.text}
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

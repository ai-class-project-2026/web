"use client";

// 1:1 대화 첫 화면: 내 모든 프로젝트의 팀원을 한눈에. 카드의 [대화하기]로 바로 1:1 대화.

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { useDM } from "./DMProvider";

export function DMHome() {
  const dm = useDM();
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:px-5">
      <header className="mb-3">
        <h1 className="text-2xl">👋 팀원 {dm.people.length}명</h1>
        <p className="text-sm text-muted-foreground">내가 참여한 모든 프로젝트의 팀원이에요. 프로젝트 채널에 올리기 애매한 이야기는 1:1로 나눠요.</p>
      </header>

      {!dm.supported && (
        <p className="mb-4 rounded-xl bg-muted px-4 py-3 text-sm">
          🛠️ 1:1 메시지 저장 기능은 서버(파트 1)에 준비 중이에요. 지금은 <Link href="/dm/demo" className="font-medium underline">데모</Link>에서 써 볼 수 있어요.
        </p>
      )}

      {dm.people.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          아직 같은 프로젝트에 있는 팀원이 없어요. 왼쪽 <b>+</b> 버튼으로 프로젝트를 만들고 초대해 보세요!
        </p>
      ) : (
        // 작은 카드를 화면 폭만큼 채워요: 카드 폭은 최소 17rem, 남는 폭은 칸 수를 늘려서 써요 (카드가 길게 늘어나지 않게)
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-2">
          {dm.people.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-xs transition hover:border-primary/30">
              <Avatar id={p.id} name={p.name} className="size-10 text-base" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground" title={p.projects.map((w) => w.name).join(", ")}>
                  {p.projects.map((w) => w.name).join(" · ")}
                </p>
              </div>
              <Link href={dm.peerHref(p.id)} className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0" })}>
                <MessageCircle /> 대화
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

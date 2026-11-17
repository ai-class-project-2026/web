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
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
      <header className="mb-4 max-w-3xl">
        <h1 className="text-2xl">👋 팀원 {dm.people.length}명</h1>
        <p className="text-sm text-muted-foreground">내가 참여한 모든 프로젝트의 팀원이에요. 프로젝트 채널에 올리기 애매한 이야기는 1:1로 나눠요.</p>
      </header>

      {!dm.supported && (
        <p className="mb-4 max-w-3xl rounded-xl bg-muted px-4 py-3 text-sm">
          🛠️ 1:1 메시지 저장 기능은 서버(파트 1)에 준비 중이에요. 지금은 <Link href="/dm/demo" className="font-medium underline">데모</Link>에서 써 볼 수 있어요.
        </p>
      )}

      {dm.people.length === 0 ? (
        <p className="max-w-3xl rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          아직 같은 프로젝트에 있는 팀원이 없어요. 왼쪽 <b>+</b> 버튼으로 프로젝트를 만들고 초대해 보세요!
        </p>
      ) : (
        // 한 줄에 한 사람: [아바타] [이름 · 함께하는 프로젝트] [대화하기]
        // 카드를 화면 폭에 맞춰 늘리면 내용 없이 길쭉해져서, 목록 폭을 제한하고 한 줄로 촘촘하게 보여줘요.
        <ul className="flex max-w-3xl flex-col divide-y overflow-hidden rounded-2xl border bg-card shadow-xs">
          {dm.people.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50">
              <Avatar id={p.id} name={p.name} className="size-10 text-base" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {p.projects.map((w) => (
                    <span key={w.id} className="rounded-md bg-muted px-1.5 py-px text-xs text-muted-foreground">{w.name}</span>
                  ))}
                </div>
              </div>
              <Link href={dm.peerHref(p.id)} className={buttonVariants({ variant: "outline", className: "shrink-0" })}>
                <MessageCircle /> 대화하기
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

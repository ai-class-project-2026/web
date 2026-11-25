"use client";

// 첫 화면: 로그인 안 했으면 /login, 워크스페이스가 없으면 /onboarding, 있으면 /w/<id>로 보내요.
// 서버가 꺼져 있으면 소개 화면과 "데모로 둘러보기" 버튼을 보여줘요.
// 맨 아래에는 개발할 때 쓰는 모든 화면 바로가기가 있어요.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { DateLeaf } from "@/components/ui/date-leaf";
import { IconCalendar, IconChat, IconHidden, IconLoading, IconPlace, IconTime } from "@/components/ui/icons";
import { api } from "@/lib/api";

const screens = [
  ["/login", "로그인/가입"],
  ["/onboarding", "온보딩"],
  ["/invite/demo", "초대 링크 (데모)"],
  ["/w/demo/c/1", "채팅 (데모)"],
  ["/w/demo/calendar", "캘린더 (데모)"],
  ["/w/demo/todos", "할 일 (데모)"],
  ["/w/demo/settings", "설정 (데모)"],
  ["/w/demo-2/c/21", "다른 프로젝트 (데모)"],
  ["/dm/demo", "1:1 대화 (데모)"],
  ["/dm/demo-2", "서연과 1:1 (데모)"],
  ["/me/demo", "마이페이지 (데모)"],
  ["/dashboard", "AI 대시보드"],
];

const features = [
  { icon: IconChat, title: "팀 채팅", desc: "채널별로 편하게 이야기해요" },
  { icon: IconCalendar, title: "AI 일정 정리", desc: "“목 7시 확정!” 하면 캘린더 등록을 제안해요" },
  { icon: IconHidden, title: "욕설 필터", desc: "ㅅ1발, tlqkf 같은 우회 욕설도 가려줘요" },
];

// 오른쪽 견본 그림에 쓰는 대화 (그림일 뿐이라 동작하지 않아요)
const sampleChat = [
  { who: "서연", before: "발표 연습 언제 해?", hl: "", after: "" },
  { who: "지호", before: "나는 ", hl: "목요일 7시", after: " 괜찮아" },
  { who: "하은", before: "좋아, ", hl: "목요일 7시", after: " 확정!" },
];

export default function Home() {
  const router = useRouter();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.GET("/auth/me");
        if (me.response.status === 401) return router.replace("/login");
        if (!me.data) return setOffline(true); // 5xx: 로그인은 그대로 두고 소개 화면을 보여줘요
        const { data } = await api.GET("/workspaces");
        router.replace(data?.length ? `/w/${data[0].id}` : "/onboarding");
      } catch {
        setOffline(true);
      }
    })();
  }, [router]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-10 md:py-14">
      <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
        {/* 왼쪽: 로고, 한 줄 소개, 버튼 */}
        <div>
          <p className="text-xl font-bold"><span className="hl">팀플</span>메이트</p>
          <h1 className="mt-5 break-keep text-4xl leading-snug md:text-5xl md:leading-snug">
            대화만 하면 AI가 <span className="hl">약속을 캘린더에 정리</span>해 주는 우리 팀 협업 공간
          </h1>

          <div className="mt-7 flex flex-wrap gap-2">
            {offline ? (
              <>
                <Link href="/w/demo" className={buttonVariants({ size: "lg", className: "px-5" })}>데모로 둘러보기</Link>
                <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline", className: "px-5" })}>로그인</Link>
              </>
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><IconLoading className="size-4 animate-spin" />들어가는 중…</p>
            )}
          </div>
          {offline && <p className="mt-3 text-xs text-muted-foreground">서버에 연결할 수 없어서 소개 화면을 보여주고 있어요</p>}
        </div>

        {/* 오른쪽: 채팅에서 일정 쪽지가 나오는 모습 (그림) */}
        <div aria-hidden className="flex flex-col gap-3 rounded-xl border bg-muted p-4">
          <ul className="flex flex-col gap-2.5">
            {sampleChat.map((m) => (
              <li key={m.who} className="flex gap-2.5 text-sm">
                <span className="w-9 shrink-0 pt-px font-medium">{m.who}</span>
                <span>
                  {m.before}
                  {m.hl && <span className="hl">{m.hl}</span>}
                  {m.after}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex overflow-hidden rounded-xl border bg-card">
            <DateLeaf date="2026-11-26" ai size="lg" className="self-stretch rounded-none" />
            <div className="border-l border-dashed" />
            <div className="min-w-0 flex-1 p-3">
              <p className="font-semibold">발표 연습</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm tabular-nums"><IconTime className="size-4" />19:00</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground"><IconPlace className="size-4" />스터디카페</p>
            </div>
          </div>
        </div>
      </div>

      <ul className="mt-12 grid gap-6 border-t pt-8 sm:grid-cols-3">
        {features.map((f) => (
          <li key={f.title}>
            <f.icon className="size-5 text-primary" aria-hidden />
            <p className="mt-2 font-semibold">{f.title}</p>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </li>
        ))}
      </ul>

      <details className="mt-10 text-sm text-muted-foreground">
        <summary className="cursor-pointer">개발용 화면 바로가기</summary>
        <ul className="mt-2 flex flex-wrap gap-2">
          {screens.map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="block rounded-md border bg-card px-3 py-1 hover:bg-muted">{label}</Link>
            </li>
          ))}
        </ul>
      </details>
    </main>
  );
}

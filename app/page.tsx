"use client";

// 첫 화면: 로그인 안 했으면 /login, 워크스페이스가 없으면 /onboarding, 있으면 /w/<id>로 보내요.
// 서버가 꺼져 있으면 소개 화면과 "데모로 둘러보기" 버튼을 보여줘요.
// 맨 아래에는 개발할 때 쓰는 모든 화면 바로가기가 있어요.

import { CalendarHeart, MessageCircleHeart, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
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
  { icon: MessageCircleHeart, color: "bg-lavender", title: "팀 채팅", desc: "채널별로 편하게 이야기해요" },
  { icon: CalendarHeart, color: "bg-mint", title: "AI 일정 정리", desc: "“목 7시 확정!” 하면 캘린더 등록을 제안해요" },
  { icon: ShieldCheck, color: "bg-peach", title: "욕설 필터", desc: "ㅅ1발, tlqkf 같은 우회 욕설도 가려줘요" },
];

export default function Home() {
  const router = useRouter();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.GET("/auth/me");
        if (!me.data) return router.replace("/login");
        const { data } = await api.GET("/workspaces");
        router.replace(data?.length ? `/w/${data[0].id}` : "/onboarding");
      } catch {
        setOffline(true);
      }
    })();
  }, [router]);

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 size-80 rounded-full bg-lavender/60 blur-3xl" />
        <div className="absolute -right-10 bottom-0 size-96 rounded-full bg-peach/50 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 size-56 rounded-full bg-mint/40 blur-3xl" />
      </div>

      <div className="relative flex max-w-2xl flex-col items-center text-center">
        <span className="mb-4 flex size-16 items-center justify-center rounded-3xl bg-butter text-4xl shadow-sm">🐣</span>
        <h1 className="text-4xl text-primary md:text-5xl">팀플메이트</h1>
        <p className="mt-3 text-lg text-foreground/80">대화만 하면 AI가 약속을 캘린더에 정리해 주는<br className="sm:hidden" /> 우리 팀 협업 공간</p>

        <div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-3xl border bg-card/80 p-4 text-left shadow-sm backdrop-blur">
              <span className={`mb-2 flex size-10 items-center justify-center rounded-2xl ${f.color}`}>
                <f.icon className="size-5 text-foreground/70" />
              </span>
              <p className="font-heading text-lg">{f.title}</p>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {offline ? (
            <>
              <Link href="/w/demo" className={buttonVariants({ size: "lg", className: "h-11 rounded-2xl px-6 text-base" })}>데모로 둘러보기</Link>
              <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline", className: "h-11 rounded-2xl px-6 text-base" })}>로그인</Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">들어가는 중…</p>
          )}
        </div>
        {offline && <p className="mt-3 text-xs text-muted-foreground">서버에 연결할 수 없어서 소개 화면을 보여주고 있어요</p>}

        <details className="mt-10 text-sm text-muted-foreground">
          <summary className="cursor-pointer">개발용 화면 바로가기</summary>
          <ul className="mt-2 flex flex-wrap justify-center gap-2">
            {screens.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="rounded-full border bg-card px-3 py-1 hover:bg-muted">{label}</Link>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </main>
  );
}

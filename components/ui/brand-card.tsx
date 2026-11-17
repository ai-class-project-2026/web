import Link from "next/link";

/** 로그인·온보딩·초대 화면에서 쓰는 가운데 카드 + 몽글몽글한 배경 */
export function BrandCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
      {/* 배경의 파스텔 방울들 */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 -top-16 size-72 rounded-full bg-lavender/60 blur-3xl" />
        <div className="absolute -bottom-20 -right-10 size-80 rounded-full bg-peach/60 blur-3xl" />
        <div className="absolute right-1/4 top-10 size-40 rounded-full bg-mint/50 blur-3xl" />
      </div>
      <div className="animate-pop relative w-full max-w-sm rounded-[2rem] border bg-card/90 p-7 shadow-xl backdrop-blur">
        <Link href="/" className="mb-5 flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-butter text-xl">🐣</span>
          <span className="font-heading text-xl text-primary">팀플메이트</span>
        </Link>
        <h1 className="text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </main>
  );
}

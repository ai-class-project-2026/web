import Link from "next/link";

/** 로그인·온보딩·초대 화면에서 쓰는 가운데 종이 카드. 로고의 "팀플"에는 형광펜 줄이 그어져 있어요 */
export function BrandCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="animate-pop w-full max-w-sm rounded-xl border bg-card p-7">
        <Link href="/" className="mb-5 inline-block text-xl font-bold">
          <span className="hl">팀플</span>메이트
        </Link>
        <h1 className="text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </main>
  );
}

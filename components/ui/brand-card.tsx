import Link from "next/link";

/** 로그인·온보딩·초대 화면에서 쓰는 가운데 종이 카드. 로고 "harmony"에는 형광펜 줄이 그어져 있어요.
    카드 윗선은 화면 높이로만 정해요 (긴 카드 640px가 가운데 오는 자리, 최대 144px).
    세로 가운데에 두면 안의 내용이 바뀔 때(로그인 ↔ 회원가입) 카드 전체가 위아래로 움직여요 */
export function BrandCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-start justify-center px-4 pb-4 pt-[clamp(1rem,calc(50dvh-20rem),9rem)]">
      {/* break-keep: 한글이 낱말 중간에서 줄바꿈되지 않게 */}
      <div className="animate-pop w-full max-w-sm break-keep rounded-xl border bg-card p-7 wrap-break-word">
        <Link href="/" className="mb-5 inline-block text-xl font-bold">
          {/* 형광펜 줄이 글자 밖으로 조금 삐져나온 만큼 당겨서, 글자가 아래 제목과 왼쪽 줄이 맞아요 */}
          <span className="hl -mx-[0.15em]">harmony</span>
        </Link>
        <h1 className="text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </main>
  );
}

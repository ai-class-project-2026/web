import type { Metadata } from "next";
import { Suspense } from "react";
import { IBM_Plex_Mono, IBM_Plex_Sans_KR, Sunflower } from "next/font/google";
import { PrefsApplier } from "@/components/app/preferences";
import "./globals.css";

// 제목·로고는 Sunflower, 본문은 IBM Plex Sans KR, 시각·날짜 숫자는 IBM Plex Mono
const plex = IBM_Plex_Sans_KR({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sunflower = Sunflower({
  variable: "--font-sunflower",
  weight: ["500", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: "500",
});

export const metadata: Metadata = {
  title: "팀플메이트",
  description: "대화만 하면 AI가 일정을 정리해 주는 팀 협업 공간",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${plex.variable} ${sunflower.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* 로그인 상태·URL에 따라 바뀌는 화면이라 전부 브라우저에서 그려요 (Next 16 cacheComponents) */}
        {/* 마이페이지 > 화면 설정(어두운 화면·글자 크기)을 모든 화면에 적용 */}
        <PrefsApplier />
        <Suspense>{children}</Suspense>
      </body>
    </html>
  );
}

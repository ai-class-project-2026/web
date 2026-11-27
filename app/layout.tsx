import type { Metadata } from "next";
import { Suspense } from "react";
import { IBM_Plex_Sans_KR } from "next/font/google";
import { PrefsApplier } from "@/components/app/preferences";
import "./globals.css";

// 글꼴은 IBM Plex Sans KR 하나만 써요. 크기와 굵기로만 구분해요
const plex = IBM_Plex_Sans_KR({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "harmony",
  description: "대화만 하면 AI가 일정을 정리해 주는 팀 협업 공간",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${plex.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* 로그인 상태·URL에 따라 바뀌는 화면이라 전부 브라우저에서 그려요 (Next 16 cacheComponents) */}
        {/* 마이페이지 > 화면 설정(글자 크기)을 모든 화면에 적용 */}
        <PrefsApplier />
        <Suspense>{children}</Suspense>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { Jua, Noto_Sans_KR } from "next/font/google";
import { PrefsApplier } from "@/components/app/preferences";
import "./globals.css";

// 본문은 읽기 편한 Noto Sans KR, 제목과 로고는 동글동글한 Jua
const noto = Noto_Sans_KR({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const jua = Jua({
  variable: "--font-jua",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "팀플메이트",
  description: "대화만 하면 AI가 일정을 정리해 주는 팀 협업 공간",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${noto.variable} ${jua.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* 로그인 상태·URL에 따라 바뀌는 화면이라 전부 브라우저에서 그려요 (Next 16 cacheComponents) */}
        {/* 마이페이지 > 화면 설정(어두운 화면·글자 크기)을 모든 화면에 적용 */}
        <PrefsApplier />
        <Suspense>{children}</Suspense>
      </body>
    </html>
  );
}

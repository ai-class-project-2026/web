import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "팀플메이트",
  description: "대화만 하면 AI가 일정을 정리해 주는 팀 협업 공간",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* 로그인 상태·URL에 따라 바뀌는 화면이라 전부 브라우저에서 그려요 (Next 16 cacheComponents) */}
        <Suspense>{children}</Suspense>
      </body>
    </html>
  );
}

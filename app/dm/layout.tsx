import { DMShell } from "@/components/dm/DMShell";

// 1:1 대화 화면들의 공통 틀 (왼쪽 프로젝트 레일 + 대화 목록)
// /dm, /dm/3 = 진짜 서버 / /dm/demo, /dm/demo-3 = 데모

export default function DMLayout({ children }: LayoutProps<"/dm">) {
  return <DMShell>{children}</DMShell>;
}

"use client";

import { useParams } from "next/navigation";

// TODO(part 2): 로그인 확인 → api.POST("/invites/{code}", { params: { path: { code } } }) → 워크스페이스로 이동

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  return <main className="p-8">초대 코드 {code}로 참가</main>;
}

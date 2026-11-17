"use client";

// 초대 링크(https://<사이트>/invite/<invite_code>)로 들어오면:
// 로그인 확인 → POST /invites/{code} → 그 워크스페이스로 이동.
// 로그인 안 했으면 로그인 화면으로 갔다가 다시 이 주소로 돌아와요.

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandCard } from "@/components/ui/brand-card";
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api";
import { DEMO_ID } from "@/lib/dummy";

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    if (code === DEMO_ID) return router.replace(`/w/${DEMO_ID}`); // 데모 초대 링크
    (async () => {
      try {
        const me = await api.GET("/auth/me");
        if (!me.data) return router.replace(`/login?next=${encodeURIComponent(`/invite/${code}`)}`);
        const { data, response } = await api.POST("/invites/{code}", { params: { path: { code } } });
        if (data) return router.replace(`/w/${data.id}`);
        setError(response.status === 404 ? "초대 링크가 올바르지 않거나 만료됐어요" : "참가하지 못했어요. 잠시 후 다시 시도해 주세요");
      } catch {
        setError("서버에 연결할 수 없어요. 서버가 켜져 있는지 확인해 주세요");
      }
    })();
  }, [code, router]);

  return (
    <BrandCard title={error ? "앗, 문제가 생겼어요 🥲" : "팀에 합류하는 중… 🎈"} subtitle={error || `초대 코드 ${code}`}>
      {error ? (
        <div className="flex gap-2">
          <Link href="/onboarding" className={buttonVariants({ className: "rounded-xl" })}>내 워크스페이스로</Link>
          <Link href="/login" className={buttonVariants({ variant: "outline", className: "rounded-xl" })}>다른 계정으로 로그인</Link>
        </div>
      ) : (
        <div className="flex justify-center py-4 text-4xl">
          <span className="animate-bounce">🐣</span>
        </div>
      )}
    </BrandCard>
  );
}

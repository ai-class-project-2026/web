"use client";

// 초대 링크(https://<사이트>/invite/<invite_code>)로 들어오면:
// 로그인 확인 → GET /invites/{code}로 코드가 맞는지와 팀 이름, AI 일정 도우미가 켜져 있는지 확인
// → "대화 분석" 안내(초대받은 사람은 설정을 못 바꾸므로 온보딩과 다른 문구) → [동의하고 참가]를 눌러야 POST /invites/{code} → 그 워크스페이스로 이동.
// 코드가 잘못됐으면 동의 화면 없이 바로 오류를 보여줘요.
// (사용자 대부분이 미성년자라 자동으로 참가시키지 않아요, 기획서 11장)
// 로그인 안 했으면 로그인 화면으로 갔다가 다시 이 주소로 돌아와요.

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandCard } from "@/components/ui/brand-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { ErrorText } from "@/components/ui/field";
import { IconLoading } from "@/components/ui/icons";
import { api } from "@/lib/api";
import { DEMO_ID } from "@/lib/dummy";

const BAD_CODE = "초대 링크가 올바르지 않거나 만료됐어요";

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  // null = 아직 확인 중. 확인이 끝나면 팀 이름과 AI 켜짐 여부
  const [info, setInfo] = useState<{ name: string; ai_schedule_on: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const joining = useRef(false); // 더블클릭해도 한 번만 참가 요청
  const [error, setError] = useState("");
  const [fatal, setFatal] = useState(false); // 참가 화면 없이 오류만 보여줄 때

  useEffect(() => {
    if (code === DEMO_ID) return router.replace(`/w/${DEMO_ID}`); // 데모 초대 링크
    (async () => {
      try {
        const me = await api.GET("/auth/me");
        if (me.response.status === 401) return router.replace(`/login?next=${encodeURIComponent(`/invite/${code}`)}`);
        if (!me.data) {
          setError("서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요");
          return setFatal(true);
        }
        const { data, response } = await api.GET("/invites/{code}", { params: { path: { code } } });
        if (data) return setInfo(data);
        if (response.status === 401) return; // 세션이 만료됐어요: 로그인 화면으로 가는 중
        setError(response.status === 404 ? BAD_CODE : "초대 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요");
        setFatal(true);
      } catch {
        setError("서버에 연결할 수 없어요. 서버가 켜져 있는지 확인해 주세요");
        setFatal(true);
      }
    })();
  }, [code, router]);

  // 버튼을 눌렀을 때만 참가해요
  const join = async () => {
    if (joining.current) return;
    joining.current = true;
    setBusy(true);
    setError("");
    try {
      const { data, response } = await api.POST("/invites/{code}", { params: { path: { code } } });
      if (data) return router.replace(`/w/${data.id}`);
      setError(response.status === 404 ? BAD_CODE : "참가하지 못했어요. 잠시 후 다시 시도해 주세요");
    } catch {
      setError("서버에 연결할 수 없어요. 서버가 켜져 있는지 확인해 주세요");
    }
    joining.current = false;
    setBusy(false);
  };

  // 확인 중이거나, 확인 자체가 실패했을 때 (잘못된 코드 포함: 동의 화면은 보여주지 않아요)
  if (!info) {
    return (
      <BrandCard title={fatal ? "앗, 문제가 생겼어요" : "초대 확인 중…"} subtitle={fatal ? undefined : `초대 코드 ${code}`}>
        {fatal ? (
          <div className="flex flex-col gap-4">
            <ErrorText>{error}</ErrorText>
            <div className="flex flex-wrap gap-2">
              <Link href="/onboarding" className={buttonVariants({ size: "lg" })}>내 프로젝트로</Link>
              <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>다른 계정으로 로그인</Link>
            </div>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><IconLoading className="size-4 animate-spin" aria-hidden />잠시만 기다려 주세요</p>
        )}
      </BrandCard>
    );
  }

  return (
    <BrandCard title="팀에 초대받았어요" subtitle={`초대 코드 ${code}`}>
      <div className="flex flex-col gap-4">
        <p className="min-w-0 break-words text-lg font-semibold">{info.name}</p>
        <div className="rounded-md bg-secondary p-3 text-sm">
          <b className="font-medium">참가하기 전에 꼭 읽어 주세요</b>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs leading-relaxed text-muted-foreground">
            {info.ai_schedule_on ? (
              <>
                <li>이 팀은 AI 일정 도우미를 켜 두었어요. 팀 채팅 메시지를 AI가 분석해 캘린더 등록을 제안해요.</li>
                <li>분석은 우리 서버 안에서만 하고, AI 학습에는 쓰지 않아요.</li>
                <li>끄는 것은 팀 방장(owner)만 할 수 있어요.</li>
                <li>동의하지 않으면 참가하지 마세요.</li>
              </>
            ) : (
              <>
                <li>이 팀은 지금 AI 일정 도우미가 꺼져 있어서, 팀 채팅 메시지를 AI가 분석하지 않아요.</li>
                <li>방장(owner)이 나중에 켜면, 켠 뒤에 보낸 메시지부터 AI가 분석해 캘린더 등록을 제안해요. 분석은 우리 서버 안에서만 하고 AI 학습에는 쓰지 않아요.</li>
                <li>동의하지 않으면 참가하지 마세요.</li>
              </>
            )}
          </ul>
        </div>
        {error && <ErrorText>{error}</ErrorText>}
        <div className="flex flex-wrap gap-2">
          <Button onClick={join} disabled={busy} size="lg">{busy ? "참가하는 중…" : "동의하고 참가"}</Button>
          <Link href="/onboarding" className={buttonVariants({ variant: "outline", size: "lg" })}>참가하지 않고 나가기</Link>
        </div>
      </div>
    </BrandCard>
  );
}

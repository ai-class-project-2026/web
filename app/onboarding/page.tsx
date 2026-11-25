"use client";

// 워크스페이스 만들기 + "대화 분석 동의" (사용자 대부분이 미성년자라 명시적으로 물어봐요, 기획서 11장)
// 동의 체크 값이 그대로 ai_schedule_on이 돼요. 초대 코드가 있으면 바로 참가할 수도 있어요.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CONSENT_DETAIL, CONSENT_TITLE } from "@/components/app/consent";
import { BrandCard } from "@/components/ui/brand-card";
import { Button } from "@/components/ui/button";
import { ErrorText, Field, Input } from "@/components/ui/field";
import { errorText } from "@/components/ui/format";
import { IconNext } from "@/components/ui/icons";
import { api, type Workspace } from "@/lib/api";

export default function OnboardingPage() {
  const router = useRouter();
  const [mine, setMine] = useState<Workspace[]>([]);
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 로그인 안 했으면 로그인으로. 이미 들어가 있는 워크스페이스가 있으면 목록으로 보여줘요.
  useEffect(() => {
    (async () => {
      try {
        const me = await api.GET("/auth/me");
        if (me.response.status === 401) return router.replace("/login?next=/onboarding");
        if (!me.data) return setError("서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요");
        const { data } = await api.GET("/workspaces");
        setMine(data ?? []);
      } catch {
        setError("서버에 연결할 수 없어요. 서버가 켜져 있는지 확인해 주세요");
      }
    })();
  }, [router]);

  const creating = useRef(false); // 더블클릭해도 팀이 한 번만 만들어지게
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating.current) return;
    creating.current = true;
    setBusy(true);
    setError("");
    try {
      const { data, error } = await api.POST("/workspaces", { body: { name: name.trim(), ai_schedule_on: agree } });
      if (data) return router.replace(`/w/${data.id}`);
      setError(errorText(error, "만들지 못했어요"));
    } catch {
      setError("서버에 연결할 수 없어요");
    }
    creating.current = false;
    setBusy(false);
  };

  // 링크 전체를 붙여 넣어도 마지막 코드만 뽑아요
  const join = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().split("/").filter(Boolean).pop();
    if (c) router.push(`/invite/${encodeURIComponent(c)}`);
  };

  return (
    <BrandCard title="우리 팀 공간 만들기" subtitle="팀 이름만 정하면 바로 시작할 수 있어요">
      {mine.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-sm font-medium text-foreground/80">내 프로젝트</p>
          <ul className="flex flex-col gap-1.5">
            {mine.map((w) => (
              <li key={w.id}>
                <Link href={`/w/${w.id}`} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
                  <span className="min-w-0">{w.name}</span> <IconNext className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={create} className="flex flex-col gap-3">
        <Field label="팀 이름">
          <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} placeholder="예: 과학탐구 팀플" />
        </Field>

        <label className="flex cursor-pointer gap-3 rounded-md bg-secondary p-3 text-sm">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-primary" />
          <span>
            <b className="font-medium">{CONSENT_TITLE}</b>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{CONSENT_DETAIL}</span>
          </span>
        </label>

        {error && <ErrorText>{error}</ErrorText>}
        <Button type="submit" disabled={busy} size="lg" className="w-full">{busy ? "만드는 중…" : "만들기"}</Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> 또는 <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={join} className="flex gap-2">
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="초대 링크나 코드 붙여넣기" aria-label="초대 코드" />
        <Button type="submit" variant="outline" className="h-auto shrink-0 px-4">참가</Button>
      </form>
    </BrandCard>
  );
}

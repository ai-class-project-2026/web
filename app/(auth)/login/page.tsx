"use client";

// 로그인 ↔ 회원가입. 성공하면 ?next= 주소(초대 링크 등)나 첫 화면("/")으로 가요.
// 첫 화면이 워크스페이스가 있으면 /w/<id>, 없으면 /onboarding으로 알아서 보내줘요.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "cn";
import { BrandCard } from "@/components/ui/brand-card";
import { Button } from "@/components/ui/button";
import { ErrorText, Field, Input } from "@/components/ui/field";
import { errorText } from "@/components/ui/format";
import { login, signup } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isSignup = mode === "signup";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { ok, error } = isSignup ? await signup(name.trim(), email.trim(), password) : await login(email.trim(), password);
      if (ok) {
        // 다른 사이트로 튀지 않게 "/"로 시작하는 주소만 허용
        router.replace(next?.startsWith("/") && !next.startsWith("//") ? next : "/");
        return;
      }
      setError(isSignup ? errorText(error, "가입하지 못했어요. 이미 쓰는 이메일인지 확인해 주세요") : "이메일이나 비밀번호가 맞지 않아요");
    } catch {
      setError("서버에 연결할 수 없어요. 서버가 켜져 있는지 확인해 주세요");
    }
    setBusy(false);
  };

  return (
    <BrandCard
      title={isSignup ? "반가워요! 👋" : "다시 만나서 반가워요"}
      subtitle={isSignup ? "이메일로 간단하게 가입해요" : "팀 채팅과 일정을 한곳에서"}
    >
      <div className="mb-5 flex gap-1 rounded-2xl bg-muted p-1 text-sm">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={cn("flex-1 rounded-xl py-1.5 transition", mode === m ? "bg-card font-medium shadow-sm" : "text-muted-foreground")}
          >
            {m === "login" ? "로그인" : "회원가입"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        {isSignup && (
          <Field label="이름" hint="팀원들에게 보이는 이름이에요">
            <Input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="nickname" placeholder="예: 민준" />
          </Field>
        )}
        <Field label="이메일">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
        </Field>
        <Field label="비밀번호">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isSignup ? 8 : undefined}
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder={isSignup ? "8자 이상" : ""}
          />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" disabled={busy} className="mt-1 h-10 rounded-xl text-base">
          {busy ? "잠시만요…" : isSignup ? "가입하고 시작하기" : "로그인"}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        서버 없이 구경만 하고 싶다면{" "}
        <Link href="/w/demo" className="font-medium text-primary underline underline-offset-2">데모로 둘러보기</Link>
      </p>
    </BrandCard>
  );
}

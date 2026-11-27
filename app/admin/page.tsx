"use client";

// 운영자 화면: 가려진 메시지와 신고된 메시지를 모든 팀에서 모아 봐요 (기획서 9.7 "운영자 검수").
// 운영자 비밀번호(서버 설정 ADMIN_PASSWORD)를 넣어야 열려요. 넣은 비밀번호는 이 탭을 닫으면 잊어요(sessionStorage).
// 5초마다 새로 불러와요. 다른 탭을 보고 있을 때는 쉬어요.
// ponytail: 폴링. 운영자 한 명이 보는 화면이라 충분해요. 여러 명이 오래 켜 두면 웹소켓으로 바꿔요

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "cn";
import { api, type AdminModerationItem as Item } from "@/lib/api";
import { splitSpans } from "@/lib/mask";
import { Button } from "@/components/ui/button";
import { ErrorText, Field, Input } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { IconHidden, IconReport } from "@/components/ui/icons";
import { Splash } from "@/components/workspace/WorkspaceShell";
import { TopBar, TopBarTitle } from "@/components/app/TopBar";

type Filter = "all" | "masked" | "false_positive" | "missed";
const POLL_MS = 5000;
const KEY = "admin-password";

const when = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });

export default function AdminPage() {
  // undefined = 저장된 비밀번호를 아직 안 읽음, null = 없음(입력 화면)
  const [password, setPassword] = useState<string | null | undefined>(undefined);
  const [denied, setDenied] = useState<string | null>(null);

  useEffect(() => {
    setPassword(sessionStorage.getItem(KEY)); // eslint-disable-line react-hooks/set-state-in-effect -- 서버에서 그린 화면과 맞추려고 그린 뒤에 읽어요
  }, []);

  const enter = (pw: string) => {
    sessionStorage.setItem(KEY, pw);
    setDenied(null);
    setPassword(pw);
  };
  // Feed가 불러오기를 다시 시작하지 않게 같은 함수를 계속 넘겨요
  const reject = useCallback((why: string) => {
    sessionStorage.removeItem(KEY);
    setDenied(why);
    setPassword(null);
  }, []);

  if (password === undefined) return <Splash>불러오는 중…</Splash>;
  if (!password) return <PasswordForm error={denied} onSubmit={enter} />;
  return <Feed password={password} onReject={reject} />;
}

function PasswordForm({ error, onSubmit }: { error: string | null; onSubmit: (pw: string) => void }) {
  const [pw, setPw] = useState("");
  return (
    <div className="flex h-dvh items-center justify-center p-6">
      <form
        className="flex w-full max-w-xs flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (pw) onSubmit(pw);
        }}
      >
        <h1 className="flex items-center gap-2 text-base font-semibold">
          <IconHidden className="size-5 text-primary" /> 욕설 모니터
        </h1>
        <Field label="운영자 비밀번호">
          <Input type="password" autoComplete="current-password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} required />
        </Field>
        {error && <ErrorText>{error}</ErrorText>}
        <Button type="submit">들어가기</Button>
      </form>
    </div>
  );
}

function Feed({ password, onReject }: { password: string; onReject: (why: string) => void }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [state, setState] = useState<"ok" | "error">("ok");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const seen = useRef<Set<number> | null>(null); // 처음 불러온 것은 조용히, 그 뒤에 새로 온 줄만 반짝이게
  const [fresh, setFresh] = useState<Set<number>>(new Set());

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const { data, response } = await api.GET("/admin/moderation", { params: { header: { "x-admin-password": password } } });
        if (!alive) return;
        if (response.status === 403) return onReject("비밀번호가 틀렸어요");
        if (response.status === 429) return onReject("여러 번 틀려서 잠겼어요. 10분 뒤에 다시 해 주세요");
        if (!data) return setState("error");
        const before = seen.current;
        setFresh(before ? new Set(data.filter((d) => !before.has(d.id)).map((d) => d.id)) : new Set());
        seen.current = new Set(data.map((d) => d.id));
        setItems(data);
        setState("ok");
        setUpdatedAt(new Date());
      } catch {
        if (alive) setState("error");
      }
    };
    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [password, onReject]);

  if (!items) return state === "error" ? <Splash tone="error">불러오지 못했어요. 서버가 켜져 있는지 확인해 주세요</Splash> : <Splash>불러오는 중…</Splash>;

  const counts = {
    all: items.length,
    masked: items.filter((i) => i.is_profane).length,
    false_positive: items.filter((i) => i.false_positive_reports > 0).length,
    missed: items.filter((i) => i.missed_reports > 0).length,
  };
  const shown = items.filter((i) =>
    filter === "all" ? true : filter === "masked" ? i.is_profane : filter === "false_positive" ? i.false_positive_reports > 0 : i.missed_reports > 0,
  );

  return (
    <div className="flex h-dvh flex-col">
      <TopBar>
        <TopBarTitle icon={IconHidden}>욕설 모니터</TopBarTitle>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
          <span aria-hidden className={cn("size-2 rounded-full", state === "error" ? "bg-destructive" : "bg-primary")} />
          {state === "error" ? "연결이 끊겼어요. 다시 시도하는 중" : `5초마다 새로 고침 · ${updatedAt?.toLocaleTimeString("ko-KR") ?? ""}`}
        </span>
      </TopBar>

      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-2">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: `전체 ${counts.all}` },
            { value: "masked", label: `가려짐 ${counts.masked}` },
            { value: "false_positive", label: `욕설 아님 신고 ${counts.false_positive}` },
            { value: "missed", label: `욕설 신고 ${counts.missed}` },
          ]}
        />
        <span className="text-xs text-muted-foreground">최근 200개 · 빨간 글자가 가려진 부분이에요</span>
      </div>

      {shown.length === 0 ? (
        <Splash tone="empty">아직 없어요</Splash>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-background text-left text-xs text-muted-foreground">
              <tr className="whitespace-nowrap border-b">
                <th className="px-4 py-2 font-medium">시각</th>
                <th className="px-2 py-2 font-medium">팀 · 채널</th>
                <th className="px-2 py-2 font-medium">보낸 사람</th>
                <th className="w-full px-2 py-2 font-medium">메시지</th>
                <th className="px-2 py-2 text-right font-medium">점수</th>
                <th className="px-2 py-2 font-medium">판정</th>
                <th className="px-4 py-2 font-medium">신고</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((i) => (
                <tr key={i.id} className={cn("border-b align-top hover:bg-muted/60", fresh.has(i.id) && "animate-pop")}>
                  <td className="whitespace-nowrap px-4 py-2 tabular-nums text-muted-foreground">{when(i.created_at)}</td>
                  <td className="whitespace-nowrap px-2 py-2">
                    {i.workspace_name} <span className="text-muted-foreground">#{i.channel_name}</span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2">{i.user_name}</td>
                  <td className="min-w-64 whitespace-pre-wrap break-words px-2 py-2">
                    <Highlighted item={i} />
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">{i.profanity_score == null ? "–" : i.profanity_score.toFixed(2)}</td>
                  <td className="whitespace-nowrap px-2 py-2">
                    {i.is_profane ? <span className="font-medium text-destructive">가림</span> : <span className="text-muted-foreground">통과</span>}
                    <span className="ml-1.5 text-xs text-muted-foreground">{i.model_version === "dict" ? "사전" : i.model_version ? "모델" : ""}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs">
                    {i.false_positive_reports > 0 && <p>욕설 아님 {i.false_positive_reports}</p>}
                    {i.missed_reports > 0 && (
                      <p className="inline-flex items-center gap-1 text-destructive">
                        <IconReport className="size-3.5" /> 욕설 신고 {i.missed_reports}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** 원문을 그대로 보여 주고, 가려진 부분만 빨갛게 칠해요. 가린 위치를 모르면 글 전체를 칠해요 */
function Highlighted({ item }: { item: Item }) {
  if (!item.is_profane) return <>{item.text}</>;
  const parts = item.profanity_spans.length ? splitSpans(item.text, item.profanity_spans) : [{ text: item.text, hidden: true }];
  return (
    <>
      {parts.map((p, k) =>
        p.hidden ? (
          <mark key={k} className="rounded-sm bg-destructive/15 px-0.5 text-destructive">{p.text}</mark>
        ) : (
          <span key={k}>{p.text}</span>
        ),
      )}
    </>
  );
}

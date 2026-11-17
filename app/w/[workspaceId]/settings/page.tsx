"use client";

// 설정 화면: 워크스페이스 이름, AI 일정 on/off, 욕설 필터 방식/민감도, 멤버, 초대 링크.
// 저장(PATCH /workspaces/{id})은 방장(owner)만 할 수 있어요. 아니면 서버가 403을 돌려줘요.

import { Check, Crown, Link2, Settings } from "lucide-react";
import { useState } from "react";
import { cn } from "cn";
import type { Workspace } from "@/lib/api";
import { TopBar, TopBarDivider, TopBarTitle } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ErrorText, Field, Input } from "@/components/ui/field";
import { Splash } from "@/components/workspace/WorkspaceShell";
import { BackToChat } from "@/components/workspace/BackToChat";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";

const MODES: { value: Workspace["filter_mode"]; emoji: string; title: string; desc: string }[] = [
  { value: "mask", emoji: "🙈", title: "가리기", desc: "욕 부분을 ●●로 가리고, [보기]를 누르면 보여줘요 (추천)" },
  { value: "warn", emoji: "⚠️", title: "경고만", desc: "원문은 그대로 두고 경고 표시만 붙여요" },
  { value: "notify_admin", emoji: "🔔", title: "가리기 + 방장 알림", desc: "가리고, 방장 화면에는 따로 표시해요" },
];

const LEVELS = [
  { value: 1, label: "느슨하게", desc: "확실한 욕만 걸러요" },
  { value: 2, label: "보통", desc: "대부분의 욕과 우회 표현" },
  { value: 3, label: "엄격하게", desc: "애매한 표현도 걸러요" },
];

export default function SettingsPage() {
  const ws = useWorkspace();
  if (!ws.workspace) return <Splash>설정을 불러오는 중…</Splash>;
  return <SettingsForm key={ws.workspace.id} workspace={ws.workspace} />;
}

function SettingsForm({ workspace }: { workspace: Workspace }) {
  const ws = useWorkspace();
  const [name, setName] = useState(workspace.name);
  const [ai, setAi] = useState(workspace.ai_schedule_on);
  const [mode, setMode] = useState(workspace.filter_mode);
  const [level, setLevel] = useState(workspace.filter_level);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const locked = !ws.isOwner;
  const inviteUrl = typeof window === "undefined" ? "" : `${location.origin}/invite/${workspace.invite_code}`;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    const err = await ws.updateWorkspace({ name: name.trim() || workspace.name, ai_schedule_on: ai, filter_mode: mode, filter_level: level });
    setBusy(false);
    setError(err ?? "");
    if (!err) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar>
        <BackToChat />
        <TopBarDivider />
        <TopBarTitle icon={Settings}>프로젝트 설정</TopBarTitle>
      </TopBar>
    <div className="flex-1 overflow-y-auto">
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4">
      {locked && (
        <p className="rounded-md bg-muted px-4 py-3 text-sm">🔒 설정은 방장만 바꿀 수 있어요. 지금은 보기만 할 수 있어요.</p>
      )}

      <form onSubmit={save} className="flex flex-col gap-4">
        <Card title="워크스페이스">
          <Field label="이름">
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={locked} maxLength={40} />
          </Field>
        </Card>

        <Card title="✨ AI 일정 도우미" desc="대화에서 확정된 약속을 찾아 '캘린더에 추가할까요?' 카드를 띄워요. 끄면 대화를 분석하지 않아요.">
          <label className={cn("flex items-center justify-between gap-4 rounded-2xl bg-muted/60 px-4 py-3", !locked && "cursor-pointer")}>
            <span className="text-sm">대화 분석해서 일정 제안하기</span>
            <Toggle checked={ai} onChange={setAi} disabled={locked} />
          </label>
        </Card>

        <Card title="🧼 욕설 필터" desc="우회 욕설(ㅅ1발, tlqkf 등)까지 AI가 찾아내요. 찾았을 때 어떻게 보여줄지 골라 주세요.">
          <div className="grid gap-2 sm:grid-cols-3">
            {MODES.map((m) => (
              <button
                type="button"
                key={m.value}
                disabled={locked}
                onClick={() => setMode(m.value)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition disabled:cursor-not-allowed",
                  mode === m.value ? "border-primary bg-primary/5 ring-3 ring-primary/15" : "hover:bg-muted/60",
                )}
              >
                <span className="text-xl">{m.emoji}</span>
                <span className="text-sm font-medium">{m.title}</span>
                <span className="text-xs text-muted-foreground">{m.desc}</span>
              </button>
            ))}
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-foreground/80">민감도</p>
            <div className="flex gap-1 rounded-2xl bg-muted p-1">
              {LEVELS.map((l) => (
                <button
                  type="button"
                  key={l.value}
                  disabled={locked}
                  onClick={() => setLevel(l.value)}
                  className={cn("flex-1 rounded-xl py-2 text-sm transition disabled:cursor-not-allowed", level === l.value ? "bg-card font-medium shadow-sm" : "text-muted-foreground")}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{LEVELS.find((l) => l.value === level)?.desc}</p>
          </div>
        </Card>

        {!locked && (
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={busy} className="rounded-xl px-5">{busy ? "저장 중…" : "저장하기"}</Button>
            {saved && <span className="flex items-center gap-1 text-sm text-primary"><Check className="size-4" /> 저장됐어요</span>}
          </div>
        )}
        <ErrorText>{error}</ErrorText>
      </form>

      <Card title={`👥 멤버 ${ws.members.length}명`}>
        <ul className="flex flex-col gap-2">
          {ws.members.map((m) => (
            <li key={m.user_id} className="flex items-center gap-3">
              <Avatar id={m.user_id} name={m.name} />
              <span className="flex-1 text-sm">
                {m.name} {m.user_id === ws.me?.id && <span className="text-xs text-muted-foreground">(나)</span>}
              </span>
              {m.role === "owner" ? (
                <span className="flex items-center gap-1 rounded-full bg-butter px-2 py-0.5 text-xs"><Crown className="size-3" /> 방장</span>
              ) : (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">팀원</span>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <Input readOnly value={inviteUrl} onFocus={(e) => e.target.select()} aria-label="초대 링크" />
          <Button
            type="button"
            variant="outline"
            className="h-auto shrink-0 rounded-xl"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(inviteUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {}
            }}
          >
            {copied ? <Check /> : <Link2 />} {copied ? "복사됨" : "복사"}
          </Button>
        </div>
      </Card>
    </main>
    </div>
    </div>
  );
}

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border bg-card p-5 shadow-sm">
      <h2 className="text-lg">{title}</h2>
      {desc && <p className="mb-3 mt-0.5 text-sm text-muted-foreground">{desc}</p>}
      <div className={desc ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60", checked ? "bg-primary" : "bg-input")}
    >
      <span className={cn("absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
    </button>
  );
}

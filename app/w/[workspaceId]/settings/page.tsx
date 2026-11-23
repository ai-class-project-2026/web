"use client";

// 설정 화면: 워크스페이스 이름, AI 일정 on/off, 욕설 필터 방식/민감도, 멤버, 초대 링크.
// 저장(PATCH /workspaces/{id})은 방장(owner)만 할 수 있어요. 아니면 서버가 403을 돌려줘요.

import { useState } from "react";
import { cn } from "cn";
import { Segmented } from "@/components/ui/segmented";
import type { Workspace } from "@/lib/api";
import type { AppIcon } from "@/components/ui/icons";
import { TopBar, TopBarDivider, TopBarTitle } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ErrorText, Input } from "@/components/ui/field";
import { IconAI, IconCheck, IconHidden, IconLink, IconLock, IconNotify, IconOwner, IconSettings, IconWarning } from "@/components/ui/icons";
import { Panel, PanelPage } from "@/components/ui/panel";
import { Splash } from "@/components/workspace/WorkspaceShell";
import { BackToChat } from "@/components/workspace/BackToChat";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";

const MODES: { value: Workspace["filter_mode"]; icon: AppIcon; title: string; desc: string }[] = [
  { value: "mask", icon: IconHidden, title: "가리기", desc: "욕 부분을 검은 줄로 가리고, [보기]를 누르면 보여줘요 (추천)" },
  { value: "warn", icon: IconWarning, title: "경고만", desc: "원문은 그대로 두고 경고 표시만 붙여요" },
  { value: "notify_admin", icon: IconNotify, title: "가리기 + 방장 알림", desc: "가리고, 방장 화면에는 따로 표시해요" },
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
        <TopBarTitle icon={IconSettings}>프로젝트 설정</TopBarTitle>
      </TopBar>
      <PanelPage
        main={
          <>
            {locked && (
              <p className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                <IconLock className="size-4 shrink-0" /> 설정은 방장만 바꿀 수 있어요. 지금은 보기만 할 수 있어요.
              </p>
            )}
            <form onSubmit={save} className="flex flex-col gap-3">
              <Panel title="프로젝트 이름">
                <Input value={name} onChange={(e) => setName(e.target.value)} disabled={locked} maxLength={40} aria-label="프로젝트 이름" />
              </Panel>

              <Panel title={<span className="flex items-center gap-1.5"><IconAI className="size-4" /> <span className="hl">AI 일정 도우미</span></span>} desc="대화에서 확정된 약속을 찾아 '캘린더에 추가할까요?' 카드를 띄워요. 끄면 대화를 분석하지 않아요.">
                <label className={cn("flex items-center justify-between gap-4 rounded-md border px-4 py-3", !locked && "cursor-pointer")}>
                  <span className="text-sm">대화 분석해서 일정 제안하기</span>
                  <Toggle checked={ai} onChange={setAi} disabled={locked} />
                </label>
              </Panel>

              <Panel title={<span className="flex items-center gap-1.5"><IconHidden className="size-4" /> 욕설 필터</span>} desc="우회 욕설(ㅅ1발, tlqkf 등)까지 AI가 찾아내요. 찾았을 때 어떻게 보여줄지 골라 주세요.">
                <p className="mb-2 text-sm font-medium">보여주는 방식</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {MODES.map((m) => (
                    <button
                      type="button"
                      key={m.value}
                      disabled={locked}
                      onClick={() => setMode(m.value)}
                      className={cn(
                        "relative flex flex-col items-start gap-1 rounded-md border p-3 text-left transition disabled:cursor-not-allowed",
                        mode === m.value ? "border-primary bg-secondary" : "hover:bg-muted/60",
                      )}
                    >
                      {mode === m.value && <IconCheck className="absolute top-2.5 right-2.5 size-4 text-primary" />}
                      <m.icon className="size-5" />
                      <span className="text-sm font-medium">{m.title}</span>
                      <span className="break-keep text-xs text-muted-foreground">{m.desc}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 border-t pt-4">
                  <p className="mb-2 text-sm font-medium">민감도</p>
                  <Segmented fill disabled={locked} value={level} onChange={setLevel} options={LEVELS} />
                  <p className="mt-1.5 text-xs text-muted-foreground">{LEVELS.find((l) => l.value === level)?.desc}</p>
                </div>
              </Panel>

              {/* 저장 줄: 화면 아래쪽에 붙어 있어서 길게 내려도 바로 누를 수 있어요 */}
              {!locked && (
                <div className="sticky bottom-0 flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                  <span className="flex-1 text-sm text-muted-foreground">
                    {saved ? <span className="flex items-center gap-1 text-primary"><IconCheck className="size-4" /> 저장됐어요</span> : "바꾼 내용은 저장해야 반영돼요"}
                  </span>
                  <Button type="submit" disabled={busy} className="px-5">{busy ? "저장 중…" : "저장하기"}</Button>
                </div>
              )}
              <ErrorText>{error}</ErrorText>
            </form>
          </>
        }
        side={
          <>
            <Panel title="초대 링크" desc="이 링크를 받은 사람은 안내를 읽고 동의하면 팀원이 돼요.">
              <div className="flex gap-2">
                <Input readOnly value={inviteUrl} onFocus={(e) => e.target.select()} aria-label="초대 링크" className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto shrink-0"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(inviteUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    } catch {}
                  }}
                >
                  {copied ? <IconCheck /> : <IconLink />} {copied ? "복사됨" : "복사"}
                </Button>
              </div>
            </Panel>

            <Panel title="멤버" action={<span className="text-sm text-muted-foreground"><span className="font-mono tabular-nums">{ws.members.length}</span>명</span>} bodyClassName="p-2">
              <ul className="flex flex-col">
                {ws.members.map((m) => (
                  <li key={m.user_id} className="flex h-11 items-center gap-2.5 rounded-md px-2">
                    <Avatar id={m.user_id} name={m.name} className="size-8 text-xs" />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {m.name} {m.user_id === ws.me?.id && <span className="text-xs text-muted-foreground">(나)</span>}
                    </span>
                    {m.role === "owner" ? (
                      <span className="flex items-center gap-1 rounded-sm bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground"><IconOwner /> 방장</span>
                    ) : (
                      <span className="rounded-sm bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">팀원</span>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          </>
        }
      />
    </div>
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
      <span className={cn("absolute top-1 left-1 size-5 rounded-full bg-card transition-transform", checked && "translate-x-5")} />
    </button>
  );
}

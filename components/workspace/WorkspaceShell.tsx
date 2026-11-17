"use client";

// 프로젝트(워크스페이스) 화면의 뼈대: [프로젝트 레일] [채널 목록 + 메뉴] [본문]
// 레일과 휴대폰 서랍은 AppFrame이 맡고, 여기서는 두 번째 줄(사이드바) 내용을 채워요.
//
// 사이드바 순서 = 자주 쓰는 순서: 프로젝트 이름 → 초대 → 채널 → 캘린더/할 일/설정 → (맨 아래 고정) 나

import { CalendarDays, Check, Hash, Link2, ListTodo, Plus, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "cn";
import { AppFrame } from "@/components/app/AppFrame";
import { UserPanel } from "@/components/app/UserPanel";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { useWorkspace } from "./WorkspaceProvider";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const ws = useWorkspace();

  if (ws.status === "loading") return <Splash>프로젝트를 불러오는 중이에요…</Splash>;
  if (ws.status === "error") {
    return (
      <Splash emoji="🥲">
        <p>{ws.errorMessage}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button className={buttonVariants({ variant: "outline" })} onClick={() => location.reload()}>다시 시도</button>
          <Link className={buttonVariants({ variant: "outline" })} href="/">처음으로</Link>
          <Link className={buttonVariants()} href="/w/demo">데모로 둘러보기</Link>
        </div>
      </Splash>
    );
  }

  return (
    <AppFrame demo={ws.demo} active={ws.workspace?.id ?? null} title={ws.workspace?.name} sidebar={<Sidebar />}>
      {children}
    </AppFrame>
  );
}

function Sidebar() {
  const ws = useWorkspace();
  const pathname = usePathname();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);

  const addChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim().replace(/^#/, "");
    if (!n) return;
    const { channel, error } = await ws.createChannel(n);
    if (error) return alert(error);
    setName("");
    setAdding(false);
    if (channel) router.push(`${ws.base}/c/${channel.id}`);
  };

  const copyInvite = async () => {
    const url = `${location.origin}/invite/${ws.workspace?.invite_code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      prompt("이 링크를 복사해서 팀원에게 보내세요", url);
    }
  };

  const todoCount = ws.todos.filter((t) => !t.done).length;
  const settingsHref = `${ws.base}/settings`;
  const settingsActive = pathname.startsWith(settingsHref);

  return (
    <>
      {/* 맨 위 줄: 프로젝트 이름 + 설정 (본문 상단 바와 같은 48px 높이로 줄을 맞춰요) */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-sidebar-border pl-4 pr-10 md:pr-2">
        <p className="min-w-0 flex-1 truncate text-base font-semibold" title={ws.workspace?.name}>{ws.workspace?.name}</p>
        <Link
          href={settingsHref}
          aria-current={settingsActive ? "page" : undefined}
          title="프로젝트 설정"
          className={cn(
            "flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-xs transition",
            settingsActive ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
          )}
        >
          <Settings className="size-4" /> 설정
        </Link>
      </div>

      {/* 큰 메뉴 줄: 자주 쓰는 화면으로 바로 가기 */}
      <div className="flex flex-col gap-0.5 border-b border-sidebar-border p-2">
        <NavItem href={`${ws.base}/calendar`} active={pathname.startsWith(`${ws.base}/calendar`)} icon={CalendarDays}>캘린더</NavItem>
        <NavItem href={`${ws.base}/todos`} active={pathname.startsWith(`${ws.base}/todos`)} icon={ListTodo} count={todoCount}>할 일</NavItem>
        <button onClick={copyInvite} className={navItemClass(false)}>
          {copied ? <Check className="size-5 shrink-0 text-primary" /> : <Link2 className="size-5 shrink-0 text-muted-foreground" />}
          <span className="min-w-0 flex-1 truncate text-left">{copied ? "초대 링크 복사됐어요!" : "팀원 초대 링크 복사"}</span>
        </button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
        {ws.demo && (
          <p className="mx-1 mt-2 flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" /> 데모 모드 · 서버 없이 둘러보는 중
          </p>
        )}
        <SectionLabel>채널 — {ws.channels.length}</SectionLabel>
        {ws.channels.map((c) => {
          const href = `${ws.base}/c/${c.id}`;
          return <NavItem key={c.id} href={href} active={pathname === href} icon={Hash}>{c.name}</NavItem>;
        })}
        {adding ? (
          <form onSubmit={addChannel} className="px-1 py-1">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="새 채널 이름 입력 후 Enter" onBlur={() => !name && setAdding(false)} />
          </form>
        ) : (
          <button onClick={() => setAdding(true)} className={cn(navItemClass(false), "text-muted-foreground")}>
            <Plus className="size-5 shrink-0" /> 채널 추가
          </button>
        )}
      </nav>

      <UserPanel me={ws.me} demo={ws.demo} sub={ws.isOwner ? "방장" : "팀원"} />
    </>
  );
}

export function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-2 pb-1 pt-4 text-xs font-semibold text-muted-foreground">
      {children}
      {action}
    </div>
  );
}

/** 사이드바 한 줄의 모양 (높이 40px, 아이콘 20px). 링크·버튼 모두 같은 모양이 나오게 따로 빼 뒀어요 */
export function navItemClass(active: boolean) {
  return cn(
    "flex h-10 w-full shrink-0 items-center gap-2.5 rounded-md px-2.5 text-sm transition",
    active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60",
  );
}

export function NavItem({ href, active, icon: Icon, count, children }: {
  href: string;
  active: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={navItemClass(active)}>
      {Icon && <Icon className="size-5 shrink-0 text-muted-foreground" />}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {!!count && <span className="rounded-full bg-primary px-2 text-xs font-medium text-primary-foreground">{count}</span>}
    </Link>
  );
}

/** 가운데에 귀여운 안내 문구를 띄우는 전체 화면 */
export function Splash({ emoji = "🐣", children }: { emoji?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
      <span className="animate-bounce text-4xl">{emoji}</span>
      <div>{children}</div>
    </div>
  );
}

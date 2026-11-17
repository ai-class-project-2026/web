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

  const nav = [
    { href: `${ws.base}/calendar`, label: "캘린더", icon: CalendarDays },
    { href: `${ws.base}/todos`, label: "할 일", icon: ListTodo, count: ws.todos.filter((t) => !t.done).length },
    { href: `${ws.base}/settings`, label: "설정", icon: Settings },
  ];

  return (
    <>
      <div className="border-b border-sidebar-border px-4 pb-3 pt-4">
        <p className="truncate pr-6 font-heading text-xl" title={ws.workspace?.name}>{ws.workspace?.name}</p>
        <p className="text-xs text-muted-foreground">팀원 {ws.members.length}명 · {ws.isOwner ? "내가 방장" : "팀원으로 참여"}</p>
        {ws.demo && (
          <p className="mt-2 flex items-center gap-1.5 rounded-xl bg-butter/60 px-3 py-1.5 text-xs">
            <Sparkles className="size-3.5" /> 데모 모드 · 서버 없이 둘러보는 중
          </p>
        )}
        <button
          onClick={copyInvite}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/40 py-1.5 text-xs text-primary transition hover:bg-primary/5"
        >
          {copied ? <><Check className="size-3.5" /> 복사됐어요!</> : <><Link2 className="size-3.5" /> 팀원 초대 링크 복사</>}
        </button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2">
        <SectionLabel action={
          <button aria-label="채널 추가" title="채널 추가" className="rounded-md p-0.5 hover:bg-sidebar-accent" onClick={() => setAdding((a) => !a)}>
            <Plus className="size-4" />
          </button>
        }>
          채널
        </SectionLabel>
        {ws.channels.map((c) => {
          const href = `${ws.base}/c/${c.id}`;
          return <NavItem key={c.id} href={href} active={pathname === href} icon={Hash}>{c.name}</NavItem>;
        })}
        {adding && (
          <form onSubmit={addChannel} className="px-1 py-1">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="새 채널 이름" onBlur={() => !name && setAdding(false)} />
          </form>
        )}

        <SectionLabel>프로젝트 관리</SectionLabel>
        {nav.map((n) => (
          <NavItem key={n.href} href={n.href} active={pathname.startsWith(n.href)} icon={n.icon} count={n.count}>
            {n.label}
          </NavItem>
        ))}
      </nav>

      <UserPanel me={ws.me} demo={ws.demo} sub={ws.isOwner ? "방장" : "팀원"} />
    </>
  );
}

export function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-2 pb-1 pt-3 text-xs font-medium text-muted-foreground">
      {children}
      {action}
    </div>
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
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-9 items-center gap-2 rounded-xl px-3 py-1.5 text-sm transition",
        active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      {Icon && <Icon className="size-4 shrink-0 opacity-70" />}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {!!count && <span className="rounded-full bg-primary/15 px-1.5 text-[11px] font-medium text-primary">{count}</span>}
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

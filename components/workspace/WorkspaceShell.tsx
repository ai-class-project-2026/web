"use client";

// 워크스페이스 화면의 뼈대: 왼쪽 사이드바(채널 목록, 메뉴) + 가운데 본문.
// 휴대폰처럼 좁은 화면에서는 사이드바가 숨고, 왼쪽 위 ☰ 버튼으로 열어요.

import { BarChart3, CalendarDays, Check, Hash, Link2, ListTodo, LogOut, Menu, Plus, Settings, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "cn";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { useWorkspace } from "./WorkspaceProvider";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const ws = useWorkspace();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  // 다른 화면으로 이동하면 (휴대폰에서 열어 둔) 사이드바를 닫아요
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  if (ws.status === "loading") return <Splash>워크스페이스를 불러오는 중이에요…</Splash>;
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
    <div className="flex h-dvh min-h-0 flex-1">
      {/* 휴대폰: 사이드바 뒤 어두운 배경 */}
      {open && <div className="fixed inset-0 z-30 bg-foreground/20 md:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar onClose={() => setOpen(false)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b px-3 py-2 md:hidden">
          <button aria-label="메뉴 열기" className="rounded-lg p-1.5 hover:bg-muted" onClick={() => setOpen(true)}>
            <Menu className="size-5" />
          </button>
          <span className="truncate font-heading text-lg">{ws.workspace?.name}</span>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

function Sidebar({ onClose }: { onClose: () => void }) {
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
    { href: `${ws.base}/todos`, label: "할 일", icon: ListTodo },
    { href: `${ws.base}/settings`, label: "설정", icon: Settings },
    { href: "/dashboard", label: "AI 대시보드", icon: BarChart3 },
  ];

  return (
    <>
      <div className="flex items-start justify-between gap-2 p-4 pb-2">
        <div className="min-w-0">
          <Link href="/" className="font-heading text-sm text-primary">팀플메이트 🐣</Link>
          <p className="truncate font-heading text-xl" title={ws.workspace?.name}>{ws.workspace?.name}</p>
        </div>
        <button aria-label="메뉴 닫기" className="rounded-lg p-1 hover:bg-sidebar-accent md:hidden" onClick={onClose}>
          <X className="size-5" />
        </button>
      </div>

      {ws.demo && (
        <p className="mx-4 mb-2 flex items-center gap-1.5 rounded-xl bg-butter/60 px-3 py-1.5 text-xs">
          <Sparkles className="size-3.5" /> 데모 모드 · 서버 없이 둘러보는 중
        </p>
      )}

      <button
        onClick={copyInvite}
        className="mx-4 mb-3 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/40 py-1.5 text-xs text-primary hover:bg-primary/5"
      >
        {copied ? <><Check className="size-3.5" /> 복사됐어요!</> : <><Link2 className="size-3.5" /> 팀원 초대 링크 복사</>}
      </button>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2">
        <div className="flex items-center justify-between px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground">
          채널
          <button aria-label="채널 추가" className="rounded-md p-0.5 hover:bg-sidebar-accent" onClick={() => setAdding((a) => !a)}>
            <Plus className="size-4" />
          </button>
        </div>
        {ws.channels.map((c) => {
          const href = `${ws.base}/c/${c.id}`;
          return (
            <NavItem key={c.id} href={href} active={pathname === href} icon={Hash}>
              {c.name}
            </NavItem>
          );
        })}
        {adding && (
          <form onSubmit={addChannel} className="px-1 py-1">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="새 채널 이름" onBlur={() => !name && setAdding(false)} />
          </form>
        )}

        <div className="px-2 pb-1 pt-4 text-xs font-medium text-muted-foreground">메뉴</div>
        {nav.map((n) => (
          <NavItem key={n.href} href={n.href} active={pathname.startsWith(n.href)} icon={n.icon}>
            {n.label}
          </NavItem>
        ))}
      </nav>

      {ws.me && (
        <div className="flex items-center gap-2 border-t border-sidebar-border p-3">
          <Avatar id={ws.me.id} name={ws.me.name} className="size-8" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-medium">{ws.me.name}</p>
            <p className="truncate text-xs text-muted-foreground">{ws.isOwner ? "방장" : "팀원"}</p>
          </div>
          <button aria-label="로그아웃" title="로그아웃" className="rounded-lg p-1.5 text-muted-foreground hover:bg-sidebar-accent" onClick={ws.logout}>
            <LogOut className="size-4" />
          </button>
        </div>
      )}
    </>
  );
}

function NavItem({ href, active, icon: Icon, children }: {
  href: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
        active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60",
      )}
    >
      <Icon className="size-4 opacity-70" />
      <span className="truncate">{children}</span>
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

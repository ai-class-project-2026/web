"use client";

// 두 번째 줄(채널/대화 목록) 맨 아래에 항상 같은 자리에 있는 "나" 영역.
// 어느 화면에서든 같은 위치라 로그아웃·내 정보를 찾느라 헤매지 않아요.

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/api";
import { logout } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";

export function UserPanel({ me, sub, demo }: { me: User | null; sub?: string; demo: boolean }) {
  const router = useRouter();
  if (!me) return null;
  return (
    <div className="flex items-center gap-2 border-t border-sidebar-border bg-sidebar p-3">
      <span className="relative">
        <Avatar id={me.id} name={me.name} className="size-8" />
        {/* 접속 중 표시 */}
        <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-sidebar bg-chart-2" />
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="truncate font-medium">{me.name}</p>
        <p className="truncate text-xs text-muted-foreground">{sub ?? me.email}</p>
      </div>
      <button
        aria-label="로그아웃"
        title="로그아웃"
        className="flex items-center gap-1 rounded-lg border bg-card px-2 py-1.5 text-xs text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
        onClick={() => {
          if (!demo) logout();
          router.replace("/login");
        }}
      >
        <LogOut className="size-4" /> 로그아웃
      </button>
    </div>
  );
}

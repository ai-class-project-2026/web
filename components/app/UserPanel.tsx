"use client";

// 두 번째 줄(채널/대화 목록) 맨 아래에 항상 같은 자리에 있는 "나" 영역.
// 어느 화면에서든 같은 위치라 내 정보를 찾느라 헤매지 않아요.
// 내 이름이나 [내 정보] 버튼을 누르면 마이페이지(비밀번호·화면 설정·로그아웃·회원 탈퇴)로 가요.

import { IconProfile } from "@/components/ui/icons";
import Link from "next/link";
import type { User } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";

export function UserPanel({ me, sub, demo }: { me: User | null; sub?: string; demo: boolean }) {
  if (!me) return null;
  const href = demo ? "/me/demo" : "/me";
  return (
    <div className="flex h-14 shrink-0 items-center gap-1 border-t border-sidebar-border bg-sidebar px-2">
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1 transition hover:bg-foreground/5">
        <span className="relative">
          <Avatar id={me.id} name={me.name} className="size-9" />
          {/* 접속 중 표시 */}
          <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-sidebar bg-chart-2" />
        </span>
        <span className="min-w-0 flex-1 text-sm">
          <span className="block truncate font-medium">{me.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{sub ?? me.email}</span>
        </span>
      </Link>
      <Link
        href={href}
        title="마이페이지 (비밀번호·화면 설정·로그아웃)"
        className="flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
      >
        <IconProfile className="size-4" /> 내 정보
      </Link>
    </div>
  );
}

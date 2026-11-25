"use client";

// 채팅 화면 오른쪽 "멤버" 탭: 역할별(방장 → 팀원)로 묶고, 각 사람 옆 대화 버튼으로 바로 1:1 대화.
// 사람을 찾는 곳(멤버 목록)과 말을 거는 버튼을 한 줄에 두어 마우스 이동을 줄였어요.

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { IconChat, IconOwner } from "@/components/ui/icons";
import { useWorkspace } from "./WorkspaceProvider";

export function MembersPanel() {
  const ws = useWorkspace();
  const groups = [
    { title: "방장", list: ws.members.filter((m) => m.role === "owner") },
    { title: "팀원", list: ws.members.filter((m) => m.role !== "owner") },
  ].filter((g) => g.list.length);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((g) => (
        <section key={g.title}>
          <h2 className="mb-1 px-2 text-sm font-semibold">
            {g.title} <span className="tabular-nums text-muted-foreground">{g.list.length}</span>
          </h2>
          <ul className="flex flex-col gap-0.5">
            {g.list.map((m) => {
              const isMe = m.user_id === ws.me?.id;
              return (
                <li key={m.user_id} className="group flex h-[2.625rem] items-center gap-3 rounded-md px-2 transition hover:bg-sidebar-accent/60">
                  <Avatar id={m.user_id} className="size-8" />
                  <span className="min-w-0 flex-1 truncate text-chat">
                    {m.name}
                    {isMe && <span className="ml-1 text-meta text-muted-foreground">(나)</span>}
                  </span>
                  {m.role === "owner" && <IconOwner className="size-4 text-primary" aria-label="방장" />}
                  {!isMe && (
                    <Link
                      href={ws.demo ? `/dm/demo-${m.user_id}` : `/dm/${m.user_id}`}
                      title={`${m.name}님과 1:1 대화`}
                      aria-label={`${m.name}님과 1:1 대화`}
                      className="flex items-center gap-1 rounded-md border bg-card px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <IconChat className="size-4" /> 대화
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

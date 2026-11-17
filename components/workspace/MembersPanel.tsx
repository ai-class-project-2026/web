"use client";

// 채팅 화면 오른쪽 "멤버" 탭: 역할별(방장 → 팀원)로 묶고, 각 사람 옆 💬 버튼으로 바로 1:1 대화.
// 사람을 찾는 곳(멤버 목록)과 말을 거는 버튼을 한 줄에 두어 마우스 이동을 줄였어요.

import { Crown, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { useWorkspace } from "./WorkspaceProvider";

export function MembersPanel() {
  const ws = useWorkspace();
  const groups = [
    { title: "방장", list: ws.members.filter((m) => m.role === "owner") },
    { title: "팀원", list: ws.members.filter((m) => m.role !== "owner") },
  ].filter((g) => g.list.length);

  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => (
        <section key={g.title}>
          <h2 className="mb-1.5 px-1 text-xs font-medium text-muted-foreground">
            {g.title} — {g.list.length}
          </h2>
          <ul className="flex flex-col gap-0.5">
            {g.list.map((m) => {
              const isMe = m.user_id === ws.me?.id;
              return (
                <li key={m.user_id} className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-card">
                  <Avatar id={m.user_id} name={m.name} className="size-8 text-xs" />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {m.name}
                    {isMe && <span className="ml-1 text-xs text-muted-foreground">(나)</span>}
                  </span>
                  {m.role === "owner" && <Crown className="size-3.5 text-accent-foreground" aria-label="방장" />}
                  {!isMe && (
                    <Link
                      href={ws.demo ? `/dm/demo-${m.user_id}` : `/dm/${m.user_id}`}
                      title={`${m.name}님과 1:1 대화`}
                      aria-label={`${m.name}님과 1:1 대화`}
                      className="rounded-lg p-1.5 text-muted-foreground opacity-60 transition hover:bg-secondary hover:text-primary group-hover:opacity-100"
                    >
                      <MessageCircle className="size-4" />
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

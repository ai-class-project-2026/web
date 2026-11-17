"use client";

// 1:1 대화 화면: 가운데 대화, 오른쪽 상대 프로필(함께하는 프로젝트, 함께하는 일정).
// 프로젝트 채팅과 같은 MessageList / MessageInput을 그대로 써서 욕설 가림도 똑같이 동작해요.

import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { Avatar } from "@/components/ui/avatar";
import { pastel, shortDate, timeLabel, todayStr } from "@/components/ui/format";
import { Splash } from "@/components/workspace/WorkspaceShell";
import { demoPath } from "@/lib/dummy";
import { demoCache } from "@/components/demo/cache";
import { useDM, type Person } from "./DMProvider";

export function DMConversation({ peerId }: { peerId: number }) {
  const dm = useDM();
  const peer = dm.people.find((p) => p.id === peerId);
  if (!peer) return <Splash emoji="🔍">같은 프로젝트에 있는 팀원과만 1:1 대화를 할 수 있어요</Splash>;

  return (
    <div className="flex min-h-0 flex-1">
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b px-4 py-2.5">
          <Avatar id={peer.id} name={peer.name} className="size-8 text-xs" />
          <h1 className="text-xl">{peer.name}</h1>
          <span className="truncate text-xs text-muted-foreground">{peer.projects.map((w) => w.name).join(" · ")}</span>
        </header>

        {!dm.supported && (
          <p className="mx-4 mt-3 rounded-2xl bg-butter/60 px-4 py-2.5 text-sm">
            🛠️ 1:1 메시지 저장 기능은 서버에 준비 중이에요. 준비되면 여기서 바로 대화할 수 있어요.
          </p>
        )}

        <MessageList
          messages={dm.messagesOf(peer.id)}
          hasMore={false}
          onLoadOlder={() => {}}
          meId={dm.me?.id}
          filterMode="mask"
          onReport={dm.demo ? async () => null : undefined}
        />
        <MessageInput
          disabled={!dm.supported}
          onSend={(text) => dm.send(peer.id, text)}
          placeholder={dm.supported ? `${peer.name}님에게 메시지 보내기` : "1:1 대화는 서버 준비 중이에요"}
        />
      </main>

      <Profile peer={peer} />
    </div>
  );
}

/** 오른쪽 프로필: 이 사람과 무엇을 같이 하고 있는지 한눈에 */
function Profile({ peer }: { peer: Person }) {
  const dm = useDM();
  const today = todayStr();
  // 함께하는 일정은 데모에서만 바로 계산할 수 있어요 (진짜 서버는 프로젝트별로 일정을 불러와야 해서 생략)
  const together = dm.demo
    ? demoCache
        .projects()
        .filter((p) => peer.projects.some((w) => w.id === p.workspace.id))
        .flatMap((p) => p.events.map((e) => ({ e, w: p.workspace })))
        .filter(({ e }) => e.status === "confirmed" && e.date >= today && e.attendees.includes(peer.name))
        .sort((a, b) => a.e.date.localeCompare(b.e.date))
        .slice(0, 4)
    : [];

  return (
    <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-l bg-muted/40 xl:flex">
      <div className={`h-20 ${pastel(peer.id)}`} />
      <div className="-mt-10 px-4">
        <Avatar id={peer.id} name={peer.name} className="size-20 border-4 border-background text-2xl" />
        <p className="mt-2 font-heading text-2xl">{peer.name}</p>
      </div>

      <section className="m-4 rounded-2xl bg-card p-3">
        <h2 className="mb-2 text-sm">함께하는 프로젝트</h2>
        <ul className="flex flex-col gap-1">
          {peer.projects.map((w) => (
            <li key={w.id}>
              <Link href={dm.demo ? demoPath(w.id) : `/w/${w.id}`} className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-sm hover:bg-muted">
                <span className={`flex size-6 items-center justify-center rounded-lg font-heading text-[10px] ${pastel(w.id)}`}>
                  {w.name.replace(/\s/g, "").slice(0, 2)}
                </span>
                {w.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {dm.demo && (
        <section className="mx-4 mb-4 rounded-2xl bg-card p-3">
          <h2 className="mb-2 text-sm">함께하는 일정</h2>
          {together.length === 0 ? (
            <p className="text-xs text-muted-foreground">다가오는 일정이 없어요</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {together.map(({ e, w }) => (
                <li key={`${w.id}-${e.id}`} className="flex items-start gap-2 text-sm">
                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block truncate">{e.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {shortDate(e.date)} {timeLabel(e)} · {w.name}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </aside>
  );
}

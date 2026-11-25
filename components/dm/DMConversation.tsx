"use client";

// 1:1 대화 화면: 가운데 대화, 오른쪽 상대 프로필(함께하는 프로젝트, 함께하는 일정).
// 프로젝트 채팅과 같은 MessageList / MessageInput을 그대로 써서 욕설 가림도 똑같이 동작해요.

import Link from "next/link";
import { TopBar, TopBarDivider, TopBarTitle } from "@/components/app/TopBar";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { Avatar } from "@/components/ui/avatar";
import { IconCalendar, IconLock } from "@/components/ui/icons";
import { pastel, shortDate, timeLabel, todayStr } from "@/components/ui/format";
import { Splash } from "@/components/workspace/WorkspaceShell";
import { demoPath } from "@/lib/dummy";
import { demoCache } from "@/components/demo/cache";
import { useDM, type Person } from "./DMProvider";

export function DMConversation({ peerId }: { peerId: number }) {
  const dm = useDM();
  const peer = dm.people.find((p) => p.id === peerId);
  if (!peer) return <Splash tone="empty">같은 프로젝트에 있는 팀원과만 1:1 대화를 할 수 있어요</Splash>;

  return (
    <div className="flex min-h-0 flex-1">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar>
          <Avatar id={peer.id} className="size-7" />
          <TopBarTitle>{peer.name}</TopBarTitle>
          <TopBarDivider />
          <span className="truncate text-sm text-muted-foreground">{peer.projects.map((w) => w.name).join(" · ")}</span>
        </TopBar>

        {!dm.supported && (
          <p className="mx-4 mt-3 flex items-center gap-2 rounded-md border bg-muted px-3 py-2.5 text-sm text-muted-foreground">
            <IconLock className="size-4 shrink-0" />
            1:1 메시지 저장 기능은 서버에 준비 중이에요. 준비되면 여기서 바로 대화할 수 있어요.
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
    <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-l bg-sidebar xl:flex">
      <div className={`h-24 ${pastel(peer.id)}`} />
      <div className="-mt-10 px-4">
        <Avatar id={peer.id} className="size-20 border-4 border-background" />
        <p className="mt-2 text-xl font-bold">{peer.name}</p>
      </div>

      <section className="m-4 rounded-xl border bg-card p-3">
        <h2 className="mb-2 text-xs font-semibold text-muted-foreground">함께하는 프로젝트</h2>
        <ul className="flex flex-col gap-1">
          {peer.projects.map((w) => (
            <li key={w.id}>
              <Link href={dm.demo ? demoPath(w.id) : `/w/${w.id}`} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-foreground/5">
                <span className={`flex size-6 items-center justify-center rounded-lg text-xs font-semibold ${pastel(w.id)}`}>
                  {w.name.replace(/\s/g, "").slice(0, 2)}
                </span>
                {w.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {dm.demo && (
        <section className="mx-4 mb-4 rounded-xl border bg-card p-3">
          <h2 className="mb-2 text-xs font-semibold text-muted-foreground">함께하는 일정</h2>
          {together.length === 0 ? (
            <p className="text-xs text-muted-foreground">다가오는 일정이 없어요</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {together.map(({ e, w }) => (
                <li key={`${w.id}-${e.id}`} className="flex items-start gap-2 text-sm">
                  <IconCalendar className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block truncate">{e.title}</span>
                    <span className="block text-xs tabular-nums text-muted-foreground">
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

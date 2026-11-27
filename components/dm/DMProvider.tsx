"use client";

// 1:1 대화(DM) 데이터 상자.
//  - 데모(/dm/demo…): lib/dummy.ts의 dummyDMs로 실제처럼 주고받을 수 있어요 (상대가 자동으로 답장해요).
//  - 진짜 서버(/dm…): 대화 상대 목록은 내 프로젝트들의 멤버(GET /workspaces/{id}/members)로 만들어요.
//    1:1 메시지를 저장/전달하는 API는 아직 server에 없어서 보내기는 막아 두었어요.
//    TODO(part 1): DM API가 생기면 아래 LIVE 부분의 messagesOf / send만 연결하면 돼요.
//      예) GET/POST /dms/{user_id}/messages, WS /ws/dms/{user_id}

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { api, type Message, type User, type Workspace } from "@/lib/api";
import { demoModerate, dummyMe } from "@/lib/dummy";
import { demoCache } from "@/components/demo/cache";

export type Person = { id: number; name: string; projects: Workspace[] };

export type DMCtx = {
  demo: boolean;
  status: "loading" | "ready" | "error";
  errorMessage?: string;
  /** 서버가 1:1 메시지를 지원하는지 (지금은 데모만 true) */
  supported: boolean;
  me: User | null;
  people: Person[];
  /** 최근 대화 순서 */
  threads: { peer: Person; last: Message }[];
  messagesOf: (peerId: number) => Message[];
  send: (peerId: number, text: string) => Promise<{ ok: boolean }>;
  peerHref: (peerId: number) => string;
  homeHref: string;
};

const Ctx = createContext<DMCtx | null>(null);

export function useDM() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDM()은 DMProvider 안에서만 쓸 수 있어요");
  return ctx;
}

/** 주소가 /dm/demo 또는 /dm/demo-3 이면 데모 */
export function useIsDemoDM() {
  const p = usePathname();
  return p === "/dm/demo" || p.startsWith("/dm/demo-");
}

export function DMProvider({ children }: { children: React.ReactNode }) {
  return useIsDemoDM() ? <DemoDM>{children}</DemoDM> : <LiveDM>{children}</LiveDM>;
}

/** 여러 프로젝트의 멤버를 사람 단위로 합쳐요 (같은 사람이 여러 프로젝트에 있으면 프로젝트 목록에 모아서) */
function mergePeople(me: User, groups: { workspace: Workspace; members: { user_id: number; name: string }[] }[]) {
  const map = new Map<number, Person>();
  for (const g of groups) {
    for (const m of g.members) {
      if (m.user_id === me.id) continue;
      const p = map.get(m.user_id) ?? { id: m.user_id, name: m.name, projects: [] };
      p.projects.push(g.workspace);
      map.set(m.user_id, p);
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

/* ───────────── 데모 ───────────── */

function DemoDM({ children }: { children: React.ReactNode }) {
  const people = mergePeople(dummyMe, demoCache.projects());
  const [threads, setThreads] = useState<Record<number, Message[]>>(() =>
    Object.fromEntries(people.map((p) => [p.id, demoCache.dm(p.id)])),
  );

  const push = (peerId: number, m: Message) =>
    setThreads((t) => {
      const next = [...(t[peerId] ?? []), m];
      demoCache.saveDm(peerId, next);
      return { ...t, [peerId]: next };
    });

  const value: DMCtx = {
    demo: true,
    status: "ready",
    supported: true,
    me: dummyMe,
    people,
    threads: people
      .filter((p) => threads[p.id]?.length)
      .map((p) => ({ peer: p, last: threads[p.id].at(-1)! }))
      .sort((a, b) => b.last.created_at.localeCompare(a.last.created_at)),
    messagesOf: (id) => threads[id] ?? [],
    async send(peerId, text) {
      push(peerId, { id: Date.now(), channel_id: -peerId, user_id: dummyMe.id, user_name: dummyMe.name, text, created_at: new Date().toISOString(), ...demoModerate(text) });
      // 데모라서 상대가 잠시 뒤 자동으로 답장해요
      const peer = people.find((p) => p.id === peerId);
      if (peer) {
        setTimeout(() => {
          const replies = ["확인했어요!", "오케이~ 고마워요", "좋아요! 이따 봐요", "넵 알겠어요!"];
          push(peerId, {
            id: Date.now() + 1, channel_id: -peerId, user_id: peer.id, user_name: peer.name,
            text: replies[Math.floor(Math.random() * replies.length)], created_at: new Date().toISOString(),
            is_profane: false, profanity_spans: [],
          });
        }, 1200);
      }
      return { ok: true };
    },
    peerHref: (id) => `/dm/demo-${id}`,
    homeHref: "/dm/demo",
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ───────────── 진짜 서버 ───────────── */

function LiveDM({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<DMCtx["status"]>("loading");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [me, setMe] = useState<User | null>(null);
  const [people, setPeople] = useState<Person[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const meRes = await api.GET("/auth/me");
        if (!alive) return;
        if (!meRes.data) {
          // 로그인이 안 됐을 때만 로그인 화면으로 보내요. 서버 오류(5xx)면 로그인은 그대로 두고 다시 시도하게 해요
          if (meRes.response.status === 401) return router.replace("/login?next=/dm");
          setErrorMessage("서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요");
          return setStatus("error");
        }
        setMe(meRes.data);
        const { data: workspaces } = await api.GET("/workspaces");
        const groups = await Promise.all(
          (workspaces ?? []).map(async (w) => {
            const { data } = await api.GET("/workspaces/{workspace_id}/members", { params: { path: { workspace_id: w.id } } });
            return { workspace: w, members: data ?? [] };
          }),
        );
        if (!alive) return;
        setPeople(mergePeople(meRes.data, groups));
        setStatus("ready");
      } catch {
        if (!alive) return;
        setErrorMessage("서버에 연결할 수 없어요. 서버가 켜져 있는지 확인해 주세요");
        setStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  const value: DMCtx = {
    demo: false,
    status,
    errorMessage,
    supported: false,
    me,
    people,
    threads: [],
    messagesOf: () => [],
    send: async () => ({ ok: false }),
    peerHref: (id) => `/dm/${id}`,
    homeHref: "/dm",
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

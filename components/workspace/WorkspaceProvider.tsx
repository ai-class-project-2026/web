"use client";

// 워크스페이스 화면들(채팅, 캘린더, 할 일, 설정)이 같이 쓰는 데이터 상자예요.
// 주소가 /w/demo, /w/demo-2 … 이면 lib/dummy.ts의 가짜 데이터로, 아니면 진짜 서버(@/lib/api)로 동작해요.
// 화면에서는 const ws = useWorkspace(); 로 꺼내 쓰면 되고, 데모인지 아닌지 신경 쓰지 않아도 돼요.

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, type Channel, type Event, type EventInput, type Member, type Message, type Suggestion, type Todo, type User, type Workspace } from "@/lib/api";
import type { components } from "@/lib/api/schema";
import { logout } from "@/lib/auth";
import { demoProjects, demoWorkspaceId, dummyMe } from "@/lib/dummy";
import { demoCache } from "@/components/demo/cache";
import { errorText } from "@/components/ui/format";

type S = components["schemas"];
export type EventUpdate = S["EventUpdate"];
export type TodoIn = S["TodoIn"];
export type TodoUpdate = S["TodoUpdate"];
export type WorkspaceUpdate = S["WorkspaceUpdate"];

/** 실패하면 에러 문구, 성공하면 null */
type Result = Promise<string | null>;

export type WorkspaceCtx = {
  demo: boolean;
  /** 링크 만들 때 쓰는 앞부분: /w/3 또는 /w/demo */
  base: string;
  status: "loading" | "ready" | "error";
  errorMessage?: string;
  me: User | null;
  workspace: Workspace | null;
  members: Member[];
  channels: Channel[];
  events: Event[];
  todos: Todo[];
  isOwner: boolean;
  reloadEvents: () => void;
  createChannel: (name: string) => Promise<{ channel?: Channel; error?: string }>;
  createEvent: (input: EventInput) => Result;
  updateEvent: (id: number, patch: EventUpdate) => Result;
  deleteEvent: (id: number) => Result;
  createTodo: (input: TodoIn) => Result;
  updateTodo: (id: number, patch: TodoUpdate) => Result;
  deleteTodo: (id: number) => Result;
  updateWorkspace: (patch: WorkspaceUpdate) => Result;
  logout: () => void;
  /** 데모일 때만: 채널을 옮겨 다녀도 보낸 메시지와 카드가 유지되도록 여기 보관 */
  demoChat?: {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    suggestions: Suggestion[];
    setSuggestions: React.Dispatch<React.SetStateAction<Suggestion[]>>;
  };
};

const Ctx = createContext<WorkspaceCtx | null>(null);

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace()는 WorkspaceProvider 안에서만 쓸 수 있어요");
  return ctx;
}

export function WorkspaceProvider({ workspaceId, children }: { workspaceId: string; children: React.ReactNode }) {
  // /w/demo, /w/demo-2 … 는 데모 프로젝트
  const demoId = demoWorkspaceId(workspaceId);
  return demoId !== null
    ? <DemoProvider key={workspaceId} id={demoId} base={`/w/${workspaceId}`}>{children}</DemoProvider>
    : <LiveProvider key={workspaceId} workspaceId={Number(workspaceId)}>{children}</LiveProvider>;
}

// 서버가 꺼져 있으면 api 호출이 예외를 던져요. 화면이 멈추지 않게 에러로 바꿔 줘요.
const OFFLINE = { detail: "서버에 연결할 수 없어요. 서버가 켜져 있는지 확인해 주세요" };
async function safe<T>(p: Promise<{ data?: T; error?: unknown; response?: Response }>) {
  try {
    return await p;
  } catch {
    return { data: undefined, error: OFFLINE as unknown, response: undefined };
  }
}

/* ───────────── 진짜 서버 ───────────── */

function LiveProvider({ workspaceId: id, children }: { workspaceId: number; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<WorkspaceCtx["status"]>("loading");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [me, setMe] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const path = { params: { path: { workspace_id: id } } };

  const reloadEvents = useCallback(() => {
    safe(api.GET("/workspaces/{workspace_id}/events", { params: { path: { workspace_id: id } } }))
      .then(({ data }) => data && setEvents(data));
  }, [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const meRes = await safe(api.GET("/auth/me"));
      if (!alive) return;
      if (!meRes.data) {
        if (meRes.error === OFFLINE) {
          setErrorMessage(OFFLINE.detail);
          setStatus("error");
        } else {
          logout();
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        }
        return;
      }
      setMe(meRes.data);
      const p = { params: { path: { workspace_id: id } } };
      const [ws, mem, ch, ev, td] = await Promise.all([
        safe(api.GET("/workspaces/{workspace_id}", p)),
        safe(api.GET("/workspaces/{workspace_id}/members", p)),
        safe(api.GET("/workspaces/{workspace_id}/channels", p)),
        safe(api.GET("/workspaces/{workspace_id}/events", p)),
        safe(api.GET("/workspaces/{workspace_id}/todos", p)),
      ]);
      if (!alive) return;
      if (!ws.data) {
        setErrorMessage(errorText(ws.error, "이 워크스페이스에 들어갈 수 없어요"));
        setStatus("error");
        return;
      }
      setWorkspace(ws.data);
      setMembers(mem.data ?? []);
      setChannels(ch.data ?? []);
      setEvents(ev.data ?? []);
      setTodos(td.data ?? []);
      setStatus("ready");
    })();
    return () => {
      alive = false;
    };
    // pathname은 처음 한 번만 필요해요 (로그인 후 돌아올 주소)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  const value: WorkspaceCtx = {
    demo: false,
    base: `/w/${id}`,
    status,
    errorMessage,
    me,
    workspace,
    members,
    channels,
    events,
    todos,
    isOwner: members.some((m) => m.user_id === me?.id && m.role === "owner"),
    reloadEvents,
    async createChannel(name) {
      const { data, error } = await safe(api.POST("/workspaces/{workspace_id}/channels", { ...path, body: { name } }));
      if (!data) return { error: errorText(error) };
      setChannels((cs) => [...cs, data]);
      return { channel: data };
    },
    async createEvent(input) {
      const { data, error } = await safe(api.POST("/workspaces/{workspace_id}/events", { ...path, body: input }));
      if (!data) return errorText(error);
      setEvents((es) => [...es, data]);
      return null;
    },
    async updateEvent(eventId, patch) {
      const { data, error } = await safe(api.PATCH("/events/{event_id}", { params: { path: { event_id: eventId } }, body: patch }));
      if (!data) return errorText(error);
      setEvents((es) => es.map((e) => (e.id === eventId ? data : e)));
      return null;
    },
    async deleteEvent(eventId) {
      const { error, response } = await safe(api.DELETE("/events/{event_id}", { params: { path: { event_id: eventId } } }));
      if (!response?.ok) return errorText(error);
      setEvents((es) => es.filter((e) => e.id !== eventId));
      return null;
    },
    async createTodo(input) {
      const { data, error } = await safe(api.POST("/workspaces/{workspace_id}/todos", { ...path, body: input }));
      if (!data) return errorText(error);
      setTodos((ts) => [...ts, data]);
      return null;
    },
    async updateTodo(todoId, patch) {
      // 체크박스는 바로 반영하고(빠르게 느껴지게), 실패하면 되돌려요
      const before = todos;
      setTodos((ts) => ts.map((t) => (t.id === todoId ? { ...t, ...patch } as Todo : t)));
      const { data, error } = await safe(api.PATCH("/todos/{todo_id}", { params: { path: { todo_id: todoId } }, body: patch }));
      if (!data) {
        setTodos(before);
        return errorText(error);
      }
      setTodos((ts) => ts.map((t) => (t.id === todoId ? data : t)));
      return null;
    },
    async deleteTodo(todoId) {
      const { error, response } = await safe(api.DELETE("/todos/{todo_id}", { params: { path: { todo_id: todoId } } }));
      if (!response?.ok) return errorText(error);
      setTodos((ts) => ts.filter((t) => t.id !== todoId));
      return null;
    },
    async updateWorkspace(patch) {
      const { data, error, response } = await safe(api.PATCH("/workspaces/{workspace_id}", { ...path, body: patch }));
      if (response?.status === 403) return "방장(owner)만 설정을 바꿀 수 있어요";
      if (!data) return errorText(error);
      setWorkspace(data);
      return null;
    },
    logout() {
      logout();
      router.replace("/login");
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ───────────── 데모 (가짜 데이터) ───────────── */

function DemoProvider({ id, base, children }: { id: number; base: string; children: React.ReactNode }) {
  const router = useRouter();
  // 없는 데모 번호(/w/demo-9)면 첫 프로젝트 데이터로 그리고 "없는 프로젝트" 안내를 띄워요
  const found = demoCache.project(id);
  const start = found ?? demoProjects[0];
  const [workspace, setWorkspace] = useState(start.workspace);
  const [channels, setChannels] = useState(start.channels);
  const [events, setEvents] = useState(start.events);
  const [todos, setTodos] = useState(start.todos);
  const [messages, setMessages] = useState(start.messages);
  const [suggestions, setSuggestions] = useState(start.suggestions);
  const members = start.members;
  const nextId = useMemo(() => {
    let n = Date.now() % 100000;
    return () => ++n;
  }, []);

  // 바뀐 내용을 보관해서 다른 프로젝트에 갔다 와도 그대로 있게
  useEffect(() => {
    if (found) demoCache.saveProject({ workspace, members, channels, events, todos, messages, suggestions });
  }, [found, workspace, members, channels, events, todos, messages, suggestions]);

  const value: WorkspaceCtx = {
    demo: true,
    base,
    status: found ? "ready" : "error",
    errorMessage: found ? undefined : "없는 데모 프로젝트예요",
    me: dummyMe,
    workspace,
    members,
    channels,
    events,
    todos,
    isOwner: members.some((m) => m.user_id === dummyMe.id && m.role === "owner"),
    reloadEvents() {},
    async createChannel(name) {
      const channel = { id: nextId(), workspace_id: workspace.id, name };
      setChannels((cs) => [...cs, channel]);
      return { channel };
    },
    async createEvent(input) {
      setEvents((es) => [...es, { ...input, id: nextId(), workspace_id: workspace.id, status: "confirmed", source: "manual" }]);
      return null;
    },
    async updateEvent(id, patch) {
      setEvents((es) => es.map((e) => (e.id === id ? ({ ...e, ...dropNulls(patch) } as Event) : e)));
      return null;
    },
    async deleteEvent(id) {
      setEvents((es) => es.filter((e) => e.id !== id));
      return null;
    },
    async createTodo(input) {
      setTodos((ts) => [...ts, { ...input, id: nextId(), workspace_id: workspace.id, done: false }]);
      return null;
    },
    async updateTodo(id, patch) {
      setTodos((ts) => ts.map((t) => (t.id === id ? ({ ...t, ...patch } as Todo) : t)));
      return null;
    },
    async deleteTodo(id) {
      setTodos((ts) => ts.filter((t) => t.id !== id));
      return null;
    },
    async updateWorkspace(patch) {
      setWorkspace((w) => ({ ...w, ...dropNulls(patch) }) as Workspace);
      return null;
    },
    logout() {
      router.push("/login");
    },
    demoChat: { messages, setMessages, suggestions, setSuggestions },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** PATCH 규칙처럼 null/undefined인 칸은 "안 바꿈"으로 처리 */
function dropNulls<T extends object>(o: T) {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined)) as Partial<T>;
}

"use client";

// 워크스페이스 화면들(채팅, 캘린더, 할 일, 설정)이 같이 쓰는 데이터 상자예요.
// 주소가 /w/demo, /w/demo-2 … 이면 lib/dummy.ts의 가짜 데이터로, 아니면 진짜 서버(@/lib/api)로 동작해요.
// 화면에서는 const ws = useWorkspace(); 로 꺼내 쓰면 되고, 데모인지 아닌지 신경 쓰지 않아도 돼요.

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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
  // 할 일마다 "가장 최근에 보낸 요청 번호". 늦게 온 옛 답이 화면을 덮어쓰지 못하게 해요
  const todoSeq = useRef(new Map<number, number>());
  const todoPending = useRef(new Map<number, Set<Promise<unknown>>>()); // 할 일마다 아직 답이 안 온 요청들
  const todosRef = useRef<Todo[]>([]);
  useEffect(() => {
    todosRef.current = todos;
  });

  const reloadTodos = useCallback(() => {
    return safe(api.GET("/workspaces/{workspace_id}/todos", { params: { path: { workspace_id: id } } }))
      .then(({ data }) => !!data && (setTodos(data), true));
  }, [id]);

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
        if (meRes.response?.status === 401) {
          // 로그인이 풀렸을 때만 로그아웃해요
          logout();
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        } else {
          // 서버가 꺼졌거나 5xx면 로그인은 그대로 두고 다시 시도하게 해요
          setErrorMessage(meRes.error === OFFLINE ? OFFLINE.detail : "서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요");
          setStatus("error");
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
      // 일부만 실패했는데 빈 목록으로 보여 주면 방장이 팀원처럼 보이는 등 잘못된 화면이 돼요.
      // 실패한 목록을 알려 주고 "다시 시도"를 누르게 해요.
      const failed = [["멤버", mem], ["채널", ch], ["일정", ev], ["할 일", td]]
        .filter(([, r]) => !(r as { data?: unknown }).data)
        .map(([name]) => name as string);
      if (failed.length) {
        setErrorMessage(`${failed.join(", ")} 목록을 불러오지 못했어요. 다시 시도해 주세요`);
        setStatus("error");
        return;
      }
      setWorkspace(ws.data);
      setMembers(mem.data!);
      setChannels(ch.data!);
      setEvents(ev.data!);
      setTodos(td.data!);
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
      const { data, error, response } = await safe(api.PATCH("/events/{event_id}", { params: { path: { event_id: eventId } }, body: patch }));
      if (!data) {
        // 다른 곳에서 이미 지워진 일정이면 목록에서도 치워요
        if (response?.status === 404 || response?.status === 410) setEvents((es) => es.filter((e) => e.id !== eventId));
        return errorText(error);
      }
      setEvents((es) => es.map((e) => (e.id === eventId ? data : e)));
      return null;
    },
    async deleteEvent(eventId) {
      const { error, response } = await safe(api.DELETE("/events/{event_id}", { params: { path: { event_id: eventId } } }));
      if (!response?.ok) {
        if (response?.status === 404 || response?.status === 410) setEvents((es) => es.filter((e) => e.id !== eventId));
        return errorText(error);
      }
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
      // 체크박스는 바로 반영하고(빠르게 느껴지게), 마지막 요청의 답으로 맞춰요.
      // 연타하면 요청이 여러 개 나가는데, 마지막이 아닌 요청의 답은 무시해야 화면이 서버와 달라지지 않아요.
      const old = todosRef.current.find((t) => t.id === todoId);
      const seq = (todoSeq.current.get(todoId) ?? 0) + 1;
      todoSeq.current.set(todoId, seq);
      setTodos((ts) => ts.map((t) => (t.id === todoId ? { ...t, ...patch } as Todo : t)));
      const req = safe(api.PATCH("/todos/{todo_id}", { params: { path: { todo_id: todoId } }, body: patch }));
      const mine = new Set(todoPending.current.get(todoId));
      todoPending.current.set(todoId, new Set([...(todoPending.current.get(todoId) ?? []), req]));
      const { data, error, response } = await req;
      todoPending.current.get(todoId)?.delete(req);
      if (todoSeq.current.get(todoId) !== seq) return null; // 더 새로운 요청이 있어요: 그쪽 답을 기다려요
      if (!data) {
        // 다른 곳에서 지워진 할 일이면 목록에서도 치워요
        if (response?.status === 404) setTodos((ts) => ts.filter((t) => t.id !== todoId));
        // 앞선 요청이 서버에 반영됐는지 알 수 없으니, 되돌리지 말고 서버 목록으로 맞춰요.
        // 단, 아직 날아가는 앞선 요청이 끝난 뒤에 받아야 그 결과까지 담겨요.
        // (서버 목록도 못 받으면 이 변경만 원래 값으로 되돌려요)
        else if (!(await Promise.allSettled([...mine]).then(reloadTodos)) && old && todoSeq.current.get(todoId) === seq) {
          const undo = Object.fromEntries(Object.keys(patch).map((k) => [k, old[k as keyof Todo]]));
          setTodos((ts) => ts.map((t) => (t.id === todoId ? { ...t, ...undo } : t)));
        }
        return errorText(error);
      }
      setTodos((ts) => ts.map((t) => (t.id === todoId ? data : t)));
      return null;
    },
    async deleteTodo(todoId) {
      todoSeq.current.set(todoId, (todoSeq.current.get(todoId) ?? 0) + 1); // 날아가는 수정 답이 지운 할 일을 되살리지 못하게
      const { error, response } = await safe(api.DELETE("/todos/{todo_id}", { params: { path: { todo_id: todoId } } }));
      if (!response?.ok) {
        if (response?.status === 404) setTodos((ts) => ts.filter((t) => t.id !== todoId));
        return errorText(error);
      }
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

// 데모에서 새로 만드는 채널·일정·할 일 번호 (프로젝트끼리 겹치지 않게 하나로 셉니다)
let demoSeq = 100000;

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
  const nextId = () => ++demoSeq;

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
      setEvents((es) => es.map((e) => (e.id === id ? ({ ...e, ...dropUndefined(patch) } as Event) : e)));
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
      setWorkspace((w) => ({ ...w, ...dropUndefined(patch) }) as Workspace);
      return null;
    },
    logout() {
      router.push("/login");
    },
    demoChat: { messages, setMessages, suggestions, setSuggestions },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** 서버 PATCH처럼: 안 보낸 칸(undefined)만 "안 바꿈", 명시한 null은 값을 비우는 뜻이라 그대로 둬요 */
function dropUndefined<T extends object>(o: T) {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

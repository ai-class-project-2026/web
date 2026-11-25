"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL, api, type EventInput, type Member, type Message, type Suggestion, type SuggestionResult, type Workspace } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Push =
  | { type: "message"; data: Message }
  | { type: "suggestion"; data: Suggestion }
  | { type: "suggestion_resolved"; data: SuggestionResult }
  | { type: "member_joined"; data: Member }
  | { type: "workspace_updated"; data: Workspace };
// ready: 인증이 끝나 이벤트를 받을 수 있게 된 순간 (처음 연결과 재연결 모두)
// denied: 서버가 1008로 닫았어요 (없는 채널, 멤버 아님, 토큰 문제). 다시 연결해도 소용없어요
type Handler = (push: Push | { type: "ready" } | { type: "denied" }) => void;

type Entry = {
  ws: WebSocket | null;
  handlers: Set<Handler>;
  retry: number; // 연속으로 실패한 횟수. 연결에 성공하면 0으로 되돌려요
  ready: boolean;
  denied: boolean;
  timer: ReturnType<typeof setTimeout> | null;
};

// One socket per channel, shared by every hook that listens to it.
const sockets = new Map<number, Entry>();

function subscribe(channelId: number, handler: Handler): () => void {
  let entry = sockets.get(channelId);
  if (!entry) {
    entry = { ws: null, handlers: new Set(), retry: 0, ready: false, denied: false, timer: null };
    sockets.set(channelId, entry);
    connect(channelId, entry);
  }
  entry.handlers.add(handler);
  // 이미 연결이 끝난(또는 거부된) 소켓에 나중에 붙은 구독자도 현재 상태를 알게 해요
  if (entry.denied) handler({ type: "denied" });
  else if (entry.ready) handler({ type: "ready" });
  const e = entry;
  return () => {
    e.handlers.delete(handler);
    if (e.handlers.size === 0) {
      if (sockets.get(channelId) === e) sockets.delete(channelId);
      if (e.timer) clearTimeout(e.timer);
      const ws = e.ws;
      e.ws = null;
      ws?.close();
    }
  };
}

function connect(channelId: number, entry: Entry) {
  // 토큰은 주소에 싣지 않아요(접속 기록에 남으니까). 연결한 뒤 첫 메시지로 보내요.
  const ws = new WebSocket(`${API_URL.replace(/^http/, "ws")}/ws/channels/${channelId}`);
  entry.ws = ws;
  entry.ready = false;
  const emit = (p: Parameters<Handler>[0]) => entry.handlers.forEach((h) => h(p));
  ws.onopen = () => ws.send(JSON.stringify({ type: "auth", token: getToken() ?? "" }));
  ws.onmessage = (e) => {
    if (entry.ws !== ws) return;
    let msg: { type?: string };
    try {
      msg = JSON.parse(e.data);
    } catch {
      return;
    }
    if (msg.type === "ready") {
      entry.ready = true;
      entry.retry = 0; // 연결에 성공했으니 다음 끊김은 다시 1초부터 기다려요
      emit({ type: "ready" });
    } else if (entry.ready) {
      emit(msg as Push);
    }
  };
  ws.onclose = (e) => {
    if (entry.ws !== ws) return; // 우리가 직접 닫았거나 낡은 소켓
    entry.ready = false;
    // 1008 = 멤버가 아님/없는 채널/잘못된 토큰: 다시 연결해도 소용없어요.
    if (e.code === 1008) {
      entry.denied = true;
      emit({ type: "denied" });
      return;
    }
    const delay = Math.min(1000 * 2 ** entry.retry, 10000);
    entry.retry += 1;
    entry.timer = setTimeout(() => {
      entry.timer = null;
      if (sockets.get(channelId) === entry) connect(channelId, entry);
    }, delay);
  };
}

const PAGE = 50;
const MAX_PAGES = 100; // 끊긴 동안 쌓인 메시지를 채울 때 한 번에 가져올 최대 쪽 수

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 보낼 때마다 새로 만드는 번호. 같은 글을 다시 보낼 때는 이 번호를 그대로 써서 서버가 한 번만 저장하게 해요. */
export function newClientId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/** 두 목록을 id로 합쳐요 (같은 id는 새 쪽 값, 순서는 id 오름차순 = 오래된 것부터) */
function mergeById(old: Message[], next: Message[]): Message[] {
  const byId = new Map(old.map((m) => [m.id, m]));
  for (const m of next) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.id - b.id);
}

type MsgState = { channelId: number; messages: Message[]; hasMore: boolean; loaded: boolean; failed: boolean; denied: boolean };
const emptyState = (channelId: number): MsgState => ({ channelId, messages: [], hasMore: true, loaded: false, failed: false, denied: false });

/**
 * Live messages of a channel, oldest first.
 *   const { messages, send, loadOlder, hasMore, loadError, denied } = useMessages(channelId);
 * loadError: 첫 기록을 못 불러왔어요 (자동으로 다시 시도 중). 빈 채널과 다르니 화면에서 구분해 주세요.
 * denied: 이 채널에 들어갈 수 없어요 (없는 채널이거나 멤버가 아님).
 */
export function useMessages(channelId: number) {
  const [raw, setRaw] = useState<MsgState>(() => emptyState(channelId));
  const state = raw.channelId === channelId ? raw : emptyState(channelId);
  // 비동기 함수 안에서 최신 상태를 읽으려고 같이 들고 있어요
  const store = useRef<MsgState>(state);
  const update = useCallback(
    (f: (s: MsgState) => MsgState) => {
      const cur = store.current.channelId === channelId ? store.current : emptyState(channelId);
      store.current = f(cur);
      setRaw(store.current);
    },
    [channelId],
  );

  // 소켓/전송으로 온 메시지 한 개를 넣어요. 순서가 뒤바뀌어 와도 id 순서로 정렬돼요.
  const add = useCallback(
    (m: Message) => {
      if (m.channel_id !== channelId) return; // 다른 채널 메시지
      update((s) => (s.messages.some((x) => x.id === m.id) ? s : { ...s, messages: mergeById(s.messages, [m]) }));
    },
    [channelId, update],
  );

  useEffect(() => {
    store.current = emptyState(channelId);
    setRaw(store.current);
    let alive = true;
    let gen = 0; // 새 동기화가 시작되면 옛 동기화의 결과는 버려요

    const page = async (before_id?: number) => {
      const { data } = await api.GET("/channels/{channel_id}/messages", {
        params: { path: { channel_id: channelId }, query: before_id === undefined ? { limit: PAGE } : { before_id, limit: PAGE } },
      });
      if (!data) throw new Error("load failed");
      return data;
    };

    // 최신 기록을 가져와 합쳐요. 이미 가진 가장 새 메시지에 닿을 때까지 이전 쪽을 계속 가져와서
    // 끊긴 동안 50개가 넘게 쌓여도 사이에 빈 구멍이 남지 않게 해요.
    const syncOnce = async (my: number) => {
      const heldMax = store.current.messages.at(-1)?.id;
      const pages: Message[][] = [await page()];
      let last = pages[0];
      while (heldMax !== undefined && last.length >= PAGE && last[0].id > heldMax && pages.length < MAX_PAGES) {
        last = await page(Math.min(...last.map((m) => m.id)));
        pages.push(last);
      }
      if (!alive || my !== gen) return;
      // 모은 걸 한꺼번에 반영해요 (중간에 끊겨도 반쯤 채워진 채로 남지 않게)
      update((s) => ({
        ...s,
        messages: mergeById(s.messages, pages.flat()),
        // 처음 성공한 불러오기에서만 "더 옛날 기록이 있는지"를 정해요
        hasMore: s.loaded ? s.hasMore : last.length >= PAGE,
        loaded: true,
        failed: false,
      }));
    };

    // 실패하면 1초, 2초, 4초… (최대 10초) 간격으로 성공할 때까지 다시 해요
    const sync = async () => {
      const my = ++gen;
      for (let attempt = 0; alive && my === gen; attempt++) {
        try {
          await syncOnce(my);
          return;
        } catch {
          if (!alive || my !== gen) return;
          update((s) => (s.failed ? s : { ...s, failed: true }));
          await sleep(Math.min(1000 * 2 ** attempt, 10000));
        }
      }
    };

    sync();
    const off = subscribe(channelId, (p) => {
      // 연결이 (다시) 열릴 때마다 기록을 다시 받아요. 연결 중에 보낸 메시지나 끊긴 동안 놓친 메시지를 채워요.
      if (p.type === "ready") sync();
      if (p.type === "denied") update((s) => ({ ...s, denied: true }));
      if (p.type === "message") add(p.data);
    });
    return () => {
      alive = false;
      off();
    };
  }, [channelId, add, update]);

  /** 실패하면 예외를 던져요. 부르는 쪽(MessageList)이 "다시 시도" 안내를 보여줘요. */
  const loadOlder = useCallback(async () => {
    const before_id = store.current.messages[0]?.id;
    if (before_id === undefined) return;
    const { data } = await api.GET("/channels/{channel_id}/messages", {
      params: { path: { channel_id: channelId }, query: { before_id, limit: PAGE } },
    });
    if (!data) throw new Error("이전 메시지를 불러오지 못했어요");
    update((s) => ({ ...s, messages: mergeById(s.messages, data), hasMore: data.length >= PAGE }));
  }, [channelId, update]);

  /**
   * The sent message arrives through the socket too; it's de-duplicated by id.
   * clientId: 같은 글을 다시 보내는 거라면 처음에 쓴 번호를 넘겨요. 서버가 이미 저장했으면 새로 만들지 않아요.
   * 네트워크가 끊겨 답을 못 받으면 같은 번호로 두 번 더 시도해요.
   */
  const send = useCallback(
    async (text: string, clientId: string = newClientId()) => {
      let last: { ok: boolean; error?: unknown } = { ok: false };
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await sleep(500 * attempt);
        try {
          const { data, error, response } = await api.POST("/channels/{channel_id}/messages", {
            params: { path: { channel_id: channelId } },
            body: { text, client_id: clientId },
          });
          if (data) {
            add(data);
            return { ok: true as const };
          }
          last = { ok: false, error };
          if (response.status < 500) break; // 4xx는 다시 보내도 같아요
        } catch (e) {
          last = { ok: false, error: e };
          if (attempt === 2) throw e; // 부르는 쪽이 "서버 연결을 확인해 주세요"를 보여줘요
        }
      }
      return last;
    },
    [channelId, add],
  );

  return {
    messages: state.messages,
    send,
    loadOlder,
    hasMore: state.hasMore,
    loadError: state.failed && !state.loaded,
    loaded: state.loaded,
    denied: state.denied,
  };
}

/**
 * 누가 프로젝트에 새로 들어오거나 방장이 설정(이름, AI, 욕설 가림 방식)을 바꾸면 불려요 (이 채널 소켓으로 알림이 와요).
 * 멤버 목록과 프로젝트 정보를 다시 받을 때 쓰세요. 연결이 (다시) 열릴 때도 불러서, 끊긴 동안 놓친 변화도 채워요.
 */
export function useWorkspaceChanged(channelId: number | undefined, onChange: () => void) {
  const ref = useRef(onChange);
  useEffect(() => {
    ref.current = onChange;
  });
  useEffect(() => {
    if (channelId === undefined) return;
    return subscribe(channelId, (p) => {
      if (p.type === "ready" || p.type === "member_joined" || p.type === "workspace_updated") ref.current();
    });
  }, [channelId]);
}

type SugState = { channelId: number; suggestions: Suggestion[]; registered: Suggestion[] };

/**
 * Pending AI schedule cards of a channel.
 *   const { suggestions, registered, act, revise } = useSuggestions(channelId);
 *   act(id, "added") | act(id, "ignored") | act(id, "edited", correctedEvent) | revise(id, "8시로 바꿔줘")
 * registered: 내가 [추가]/[수정]으로 등록한 카드. 지우지 않고 "등록됨"으로 보여 줄 수 있게 따로 남겨요.
 */
export function useSuggestions(
  channelId: number,
  /** 누군가(나 포함) 카드를 처리했을 때 불려요. 캘린더·일정 패널을 새로고침할 때 쓰세요 */
  onResolved?: (r: SuggestionResult) => void,
) {
  const [state, setState] = useState<SugState>({ channelId, suggestions: [], registered: [] });
  const cur = state.channelId === channelId ? state : { channelId, suggestions: [], registered: [] };
  // 본 적 있는 카드들. 다른 화면의 "처리됨" 푸시가 [추가] 응답보다 먼저 와서 카드가 지워져도 내용을 알 수 있게 해요
  const known = useRef(new Map<number, Suggestion>());
  // 이미 처리된 카드 번호: 늦게 도착한 GET/푸시가 지워진 카드를 되살리지 못하게 기억해 둬요
  const resolved = useRef(new Set<number>());
  const onResolvedRef = useRef(onResolved);
  useEffect(() => {
    onResolvedRef.current = onResolved;
  });
  const update = useCallback(
    (f: (s: SugState) => SugState) =>
      setState((s) => f(s.channelId === channelId ? s : { channelId, suggestions: [], registered: [] })),
    [channelId],
  );

  useEffect(() => {
    let alive = true;
    resolved.current = new Set();
    known.current = new Map();
    // GET을 보내고 답이 오는 사이에 푸시로 먼저 도착한 카드들 (GET 결과에 빠져 있어도 남겨요)
    let during: Map<number, Suggestion> | null = null;
    const load = () => {
      const pushed = new Map<number, Suggestion>();
      during = pushed;
      return api
        .GET("/channels/{channel_id}/suggestions", { params: { path: { channel_id: channelId } } })
        .then(({ data }) => {
          if (!alive || !data) return;
          const byId = new Map<number, Suggestion>();
          for (const x of [...data, ...pushed.values()]) {
            known.current.set(x.id, x);
            if (!resolved.current.has(x.id)) byId.set(x.id, x);
          }
          update((s) => ({ ...s, suggestions: [...byId.values()] }));
        })
        .catch(() => {})
        .finally(() => {
          if (during === pushed) during = null;
        });
    };
    load();
    const off = subscribe(channelId, (p) => {
      if (p.type === "ready") load(); // 연결이 열릴 때마다 놓친 카드를 다시 받아요
      if (p.type === "suggestion") {
        known.current.set(p.data.id, p.data);
        if (resolved.current.has(p.data.id)) return;
        during?.set(p.data.id, p.data);
        // 이미 있는 카드면 그 자리에서 내용만 바꿔요 (누가 말로 고친 카드가 같은 번호로 다시 와요)
        update((s) => ({
          ...s,
          suggestions: s.suggestions.some((x) => x.id === p.data.id)
            ? s.suggestions.map((x) => (x.id === p.data.id ? p.data : x))
            : [...s.suggestions, p.data],
        }));
      }
      if (p.type === "suggestion_resolved") {
        const id = p.data.suggestion.id;
        resolved.current.add(id);
        during?.delete(id);
        update((s) => ({ ...s, suggestions: s.suggestions.filter((x) => x.id !== id) }));
        onResolvedRef.current?.(p.data);
      }
    });
    return () => {
      alive = false;
      off();
    };
  }, [channelId, update]);

  const act = useCallback(
    async (
      id: number,
      action: "added" | "edited" | "ignored",
      event?: EventInput,
    ) => {
      const card = known.current.get(id);
      const { data, error, response } = await api.POST("/suggestions/{suggestion_id}/action", {
        params: { path: { suggestion_id: id } },
        body: { action, event },
      });
      // 409 = 다른 사람이 먼저 처리한 카드예요. 이미 끝난 일이니 카드를 지워요.
      const conflict = response.status === 409;
      if (data || conflict) {
        resolved.current.add(id);
        const keep = data && action !== "ignored" && card;
        update((s) => ({
          ...s,
          suggestions: s.suggestions.filter((x) => x.id !== id),
          // 내가 등록한 카드는 "등록됨"으로 남겨요 (고쳐서 등록했다면 고친 내용으로)
          registered: keep
            ? [...s.registered.filter((x) => x.id !== id), { ...card, payload: { ...card.payload, event: { ...card.payload.event, ...(event ?? {}) } as Suggestion["payload"]["event"] } }]
            : s.registered,
        }));
      }
      return { ok: !!data, conflict, event: data?.event ?? null, error };
    },
    [update],
  );

  /** 카드를 한 줄 말로 고쳐요 ("8시로 바꿔줘"). 고친 카드는 모든 팀원 화면에서 같은 자리에서 바뀌어요. changed: 바뀐 칸 이름 */
  const revise = useCallback(
    async (id: number, text: string) => {
      const { data, error, response } = await api.POST("/suggestions/{suggestion_id}/revise", {
        params: { path: { suggestion_id: id } },
        body: { text },
      });
      const conflict = response.status === 409; // 그 사이 누가 카드를 처리했어요
      if (data) {
        known.current.set(id, data.suggestion);
        update((s) => ({ ...s, suggestions: s.suggestions.map((x) => (x.id === id ? data.suggestion : x)) }));
      } else if (conflict) {
        resolved.current.add(id);
        update((s) => ({ ...s, suggestions: s.suggestions.filter((x) => x.id !== id) }));
      }
      return { ok: !!data, changed: data?.changed ?? [], conflict, error };
    },
    [update],
  );

  return { suggestions: cur.suggestions, registered: cur.registered, act, revise };
}

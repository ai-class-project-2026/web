"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL, api, type EventInput, type Message, type Suggestion, type SuggestionResult } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Push =
  | { type: "message"; data: Message }
  | { type: "suggestion"; data: Suggestion }
  | { type: "suggestion_resolved"; data: SuggestionResult };
type Handler = (push: Push | { type: "reconnected" }) => void;

// One socket per channel, shared by every hook that listens to it.
const sockets = new Map<number, { ws: WebSocket; handlers: Set<Handler> }>();

function subscribe(channelId: number, handler: Handler): () => void {
  let entry = sockets.get(channelId);
  if (!entry) {
    entry = { ws: open(channelId), handlers: new Set() };
    sockets.set(channelId, entry);
  }
  entry.handlers.add(handler);
  return () => {
    entry.handlers.delete(handler);
    if (entry.handlers.size === 0) {
      sockets.delete(channelId);
      entry.ws.close();
    }
  };
}

function open(channelId: number, retry = 0): WebSocket {
  const url = `${API_URL.replace(/^http/, "ws")}/ws/channels/${channelId}?token=${getToken()}`;
  const ws = new WebSocket(url);
  const emit = (p: Parameters<Handler>[0]) =>
    sockets.get(channelId)?.handlers.forEach((h) => h(p));
  ws.onopen = () => retry > 0 && emit({ type: "reconnected" });
  ws.onmessage = (e) => emit(JSON.parse(e.data));
  ws.onclose = (e) => {
    const entry = sockets.get(channelId);
    // 1008 = not a member / bad token: retrying won't help.
    if (!entry || entry.ws !== ws || e.code === 1008) return;
    setTimeout(() => {
      if (sockets.get(channelId) === entry) entry.ws = open(channelId, retry + 1);
    }, Math.min(1000 * 2 ** retry, 10000));
  };
  return ws;
}

/**
 * Live messages of a channel, oldest first.
 *   const { messages, send, loadOlder, hasMore } = useMessages(channelId);
 */
export function useMessages(channelId: number) {
  const [state, setState] = useState({ channelId, messages: [] as Message[], hasMore: true });
  const { messages, hasMore } =
    state.channelId === channelId ? state : { messages: [] as Message[], hasMore: true };
  const add = (m: Message) =>
    setState((s) =>
      s.channelId !== m.channel_id || s.messages.some((x) => x.id === m.id)
        ? s
        : { ...s, messages: [...s.messages, m] },
    );

  useEffect(() => {
    const load = () =>
      api
        .GET("/channels/{channel_id}/messages", { params: { path: { channel_id: channelId } } })
        .then(({ data }) =>
          setState({ channelId, messages: data ?? [], hasMore: (data?.length ?? 0) === 50 }),
        );
    load();
    return subscribe(channelId, (p) => {
      if (p.type === "reconnected") load(); // fill the gap while offline
      if (p.type === "message") add(p.data);
    });
  }, [channelId]);

  const loadOlder = useCallback(async () => {
    const before_id = messages[0]?.id;
    if (before_id === undefined) return;
    const { data } = await api.GET("/channels/{channel_id}/messages", {
      params: { path: { channel_id: channelId }, query: { before_id } },
    });
    setState((s) => ({
      channelId,
      messages: [...(data ?? []), ...s.messages],
      hasMore: (data?.length ?? 0) === 50,
    }));
  }, [channelId, messages]);

  /** The sent message arrives through the socket too; it's de-duplicated by id. */
  const send = useCallback(
    async (text: string) => {
      const { data, error } = await api.POST("/channels/{channel_id}/messages", {
        params: { path: { channel_id: channelId } },
        body: { text },
      });
      if (data) add(data);
      return { ok: !!data, error };
    },
    [channelId],
  );

  return { messages, send, loadOlder, hasMore };
}

/**
 * Pending AI schedule cards of a channel.
 *   const { suggestions, act } = useSuggestions(channelId);
 *   act(id, "added") | act(id, "ignored") | act(id, "edited", correctedEvent)
 */
export function useSuggestions(channelId: number) {
  const [state, setState] = useState({ channelId, suggestions: [] as Suggestion[] });
  const suggestions = state.channelId === channelId ? state.suggestions : [];
  const update = useCallback(
    (f: (ss: Suggestion[]) => Suggestion[]) =>
      setState((s) => (s.channelId === channelId ? { channelId, suggestions: f(s.suggestions) } : s)),
    [channelId],
  );

  useEffect(() => {
    const load = () =>
      api
        .GET("/channels/{channel_id}/suggestions", { params: { path: { channel_id: channelId } } })
        .then(({ data }) => setState({ channelId, suggestions: data ?? [] }));
    load();
    return subscribe(channelId, (p) => {
      if (p.type === "reconnected") load();
      if (p.type === "suggestion") update((ss) => [...ss, p.data]);
      if (p.type === "suggestion_resolved")
        update((ss) => ss.filter((s) => s.id !== p.data.suggestion.id));
    });
  }, [channelId, update]);

  const act = useCallback(
    async (
      id: number,
      action: "added" | "edited" | "ignored",
      event?: EventInput,
    ) => {
      const { data, error } = await api.POST("/suggestions/{suggestion_id}/action", {
        params: { path: { suggestion_id: id } },
        body: { action, event },
      });
      if (data) update((ss) => ss.filter((s) => s.id !== id));
      return { ok: !!data, event: data?.event ?? null, error };
    },
    [update],
  );

  return { suggestions, act };
}

import createClient from "openapi-fetch";
import { getToken, logout } from "@/lib/auth";
import type { components, paths } from "./schema";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Typed client generated from the server's OpenAPI schema.
 *   const { data, error } = await api.GET("/workspaces/{workspace_id}/events", {
 *     params: { path: { workspace_id: 1 }, query: { start: "2026-10-01" } },
 *   });
 * Paths, params and response types autocomplete; a wrong field is a type error.
 */
export const api = createClient<paths>({ baseUrl: API_URL });

// 로그인·가입 요청의 401은 "비밀번호 틀림"이라서 세션 만료로 보면 안 돼요
const PUBLIC_PATHS = ["/auth/login", "/auth/signup"];
let leaving = false;

api.use({
  onRequest({ request }) {
    const token = getToken();
    if (token) request.headers.set("Authorization", `Bearer ${token}`);
    return request;
  },
  onResponse({ request, response }) {
    // 토큰을 보냈는데 401이면 세션이 만료된 거예요: 토큰을 지우고 로그인 화면으로 보내요.
    // (5xx나 네트워크 오류는 여기로 오지 않아서 로그아웃되지 않아요)
    if (response.status !== 401 || !request.headers.has("Authorization") || typeof window === "undefined") return;
    if (PUBLIC_PATHS.some((p) => new URL(request.url).pathname === p)) return;
    logout();
    if (leaving || location.pathname.startsWith("/login")) return;
    leaving = true;
    location.replace(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
  },
});

type S = components["schemas"];
export type User = S["UserOut"];
export type Workspace = S["WorkspaceOut"];
export type Member = S["MemberOut"];
export type Channel = S["ChannelOut"];
export type Message = S["MessageOut"];
export type Event = S["EventOut"];
export type EventInput = S["EventIn"];
/** 일정 칸 이름 (카드를 고쳐 등록할 때 "내가 고친 칸"으로 보내요) */
export type EventField = NonNullable<S["SuggestionActionIn"]["changed"]>[number];
export type Todo = S["TodoOut"];
export type Suggestion = S["SuggestionOut"];
export type SuggestionResult = S["SuggestionResult"];
export type AdminModerationItem = S["AdminModerationItem"];
/** 말로 쓴 한 줄에서 읽어 낸 일정 초안 (일정 추가 창을 채울 때) */
export type ParsedEvent = S["EventDraft"];

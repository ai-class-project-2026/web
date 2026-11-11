import createClient from "openapi-fetch";
import { getToken } from "@/lib/auth";
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

api.use({
  onRequest({ request }) {
    const token = getToken();
    if (token) request.headers.set("Authorization", `Bearer ${token}`);
    return request;
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
export type Todo = S["TodoOut"];
export type Suggestion = S["SuggestionOut"];
export type SuggestionResult = S["SuggestionResult"];

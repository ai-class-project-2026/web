# web

팀플메이트 웹앱. Next.js + Tailwind.

채팅, 캘린더, 할 일 화면과 AI 일정 카드, 욕설 가림 UI를 담당한다. 백엔드(인증, DB, 실시간 채팅, AI)는 전부 [server](https://github.com/ai-class-project-2026/server)의 FastAPI가 맡고, 웹은 그 REST API와 WebSocket만 호출한다.

기획서: [plan](https://github.com/ai-class-project-2026/plan)

## 스택

Next.js (App Router) + Tailwind + shadcn/ui, 캘린더는 FullCalendar. API 타입은 server의 openapi.json에서 openapi-typescript로 생성한다.

## 실행

```sh
cp .env.example .env.local   # NEXT_PUBLIC_API_URL
npm install
npm run dev                  # http://localhost:3000
```

API 타입 갱신 (server 레포가 옆 폴더에 있을 때):

```sh
(cd ../server && make openapi) && npm run gen:api   # → lib/api/schema.d.ts
```

shadcn 컴포넌트 추가: `npx shadcn@latest add button`

## 서버와 연결하기 (화면에서 쓰는 것)

| 가져올 것 | 용도 |
|---|---|
| `api` (`@/lib/api`) | REST 호출. 경로와 필드가 자동완성되고, 틀리면 타입 에러 |
| `login`, `signup`, `logout`, `useMe` (`@/lib/auth`) | 로그인 상태 |
| `useMessages(channelId)` (`@/lib/ws`) | 채팅: `messages`, `send(text)`, `loadOlder()`, `hasMore` (실시간 반영) |
| `useSuggestions(channelId)` (`@/lib/ws`) | AI 일정 카드: `suggestions`, `act(id, "added" \| "edited" \| "ignored", event?)` |
| `splitSpans(text, spans)` (`@/lib/mask`) | 욕설 가림: 메시지를 보이는 부분/가릴 부분으로 나눔 |
| 타입 `Workspace`, `Message`, `Event`, `Todo`, `Suggestion` … (`@/lib/api`) | props 타입 |

```tsx
const { data: events } = await api.GET("/workspaces/{workspace_id}/events", {
  params: { path: { workspace_id: 1 }, query: { start: "2026-10-01", end: "2026-10-31" } },
});
await api.PATCH("/todos/{todo_id}", { params: { path: { todo_id: 3 } }, body: { done: true } });
```

`npm test`: `lib/*.test.ts` 실행 (node 내장 테스트).

AI 사용 기록: [`ai-sessions/`](ai-sessions/README.md) (처음 한 번 `git config ai.part partN`)

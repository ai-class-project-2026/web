# AI 작업 지침 (web)

harmony 웹 화면 레포. Next.js(App Router) + Tailwind + shadcn/ui. 백엔드는 server 레포의 FastAPI. 기획서: https://github.com/ai-class-project-2026/plan

## 파트별 담당

작업자의 파트는 `git config ai.part`로 확인한다. 본인 파트 밖의 파일을 고쳐야 하면 먼저 물어본다.

| 파트 | 폴더 |
|---|---|
| part1 | `lib/api/`, `lib/auth/`, `lib/ws/` (API 클라이언트, 인증, 실시간 훅) |
| part2 | `app/`, `components/`, `lib/dummy.ts` (화면 전부) |

`TODO(part 2)` 주석이 있는 곳이 파트 2가 채울 자리다.

## 지켜야 할 것

* API는 `@/lib/api`(`api.GET/POST/...`), 실시간은 `@/lib/ws`의 `useMessages`, `useSuggestions`로만 부른다. fetch나 WebSocket을 직접 만들지 않는다
* `lib/api/schema.d.ts`는 직접 고치지 않는다. 서버 API가 바뀌면 `(cd ../server && make openapi) && npm run gen:api`
* 욕설 가림은 `@/lib/mask`의 `splitSpans`를 쓴다
* `.env.local`, 토큰, 비밀번호는 코드나 로그에 넣지 않는다
* 새 도구나 의존성(테스트 프레임워크, CI, 상태관리 라이브러리 등)은 요청 없이 추가하지 않는다

## 실행

```sh
npm install
npm run dev    # http://localhost:3000, 첫 화면에 모든 화면 링크
npm run lint && npm run build   # PR 전에 확인
```

## 설명 방식

팀원 대부분이 초보자다. 코드를 바꾸면 무엇을 왜 바꿨는지 쉬운 말로 짧게 설명한다.
작업 기록은 `ai-sessions/<파트>/`에 자동으로 남는다 (`ai-sessions/README.md`).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

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

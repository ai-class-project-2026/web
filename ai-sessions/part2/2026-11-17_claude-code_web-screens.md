# AI 세션 2026-11-17 Claude Code

- 파트: part2
- 도구: Claude Code (claude-opus-5-5)
- 브랜치: `smartshark9319`
- 참고: 상위 폴더에서 세션을 시작해서 `.claude` 훅 자동 기록이 안 돼서 직접 작성함

---

## 프롬프트 1

> 깔끔하고 친숙하고 아기자기한 채팅 웹사이트를 만들거야. 이것의 목적은 학생들이나 직장인들이 프로젝트를 진행할 때
> 웹에 있는 캘린더를 사용하여 일정관리를 쉽게 정하고 확인할 수 있고, 욕설들을 감지하면 검열하는 것을 만들려고 해.
> https://github.com/ai-class-project-2026/web 여기에 smartshark9319 계정으로 브랜치를 만들고 파일 코드 수정을 할 때마다 커밋해줘

## 프롬프트 2

> https://github.com/ai-class-project-2026/plan 에서 내 역할은 파트2야. 그 부분들을 확인하고 내 역할에 맞는 부분만 수행해줘

### 결과

plan 레포의 `part2-web.md`(파트 2: 웹 화면)와 web 레포 `AGENTS.md`의 담당 폴더(`app/`, `components/`, `lib/dummy.ts`)만 수정했다.
파트 1 영역(`lib/api/`, `lib/auth/`, `lib/ws/`)은 import만 하고 고치지 않았다.

**디자인 방향**: 크림색 바탕 + 라벤더/민트/피치 파스텔, 둥근 모서리, 제목 폰트 Jua(동글동글), 본문 Noto Sans KR.

**데모 모드**: 주소에 워크스페이스 id 대신 `demo`를 넣으면(`/w/demo/c/1`) 서버 없이 `lib/dummy.ts` 데이터로 모든 화면이 동작한다.
기획서 완료 기준 "더미 데이터로 모든 화면이 동작함"을 위해서다. 숫자 id면 진짜 서버(`@/lib/api`, `useMessages`, `useSuggestions`)를 쓴다.

| 화면 | 파일 | 한 일 |
|---|---|---|
| 첫 화면 | `app/page.tsx` | 로그인/워크스페이스 여부로 자동 이동, 서버 꺼져 있으면 소개 + 데모 버튼, 개발용 화면 링크 |
| 로그인/가입 | `app/(auth)/login/page.tsx` | 탭 전환, `?next=` 주소로 복귀 |
| 온보딩 | `app/onboarding/page.tsx` | 워크스페이스 만들기 + 대화 분석 동의(`ai_schedule_on`), 초대 코드 참가, 내 워크스페이스 목록 |
| 초대 | `app/invite/[code]/page.tsx` | 로그인 확인 → `POST /invites/{code}` → 이동 |
| 레이아웃 | `app/w/[workspaceId]/layout.tsx`, `components/workspace/*` | 왼쪽 채널 목록(추가 가능), 메뉴, 초대 링크 복사, 휴대폰용 접는 사이드바 |
| 채팅 | `app/w/[workspaceId]/c/[channelId]/page.tsx`, `components/chat/*` | 말풍선, 날짜 구분선, 위로 스크롤 시 `loadOlder()`, Enter 전송(한글 조합 중 방지), AI 카드를 시간순으로 끼워 넣기, 오른쪽 다가오는 일정/할 일 |
| 욕설 가림 | `components/chat/MaskedMessage.tsx` | `splitSpans`로 ●● 처리, [보기], `filter_mode`별(mask/warn/notify_admin) 표시, spans가 비면 전체 가림, [욕설 아님]/🚩 신고 |
| AI 일정 카드 | `components/schedule-card/ScheduleCard.tsx` | add/update/cancel별 문구와 버튼, 수정 폼 → `act(id, "edited", 고친값)` |
| 캘린더 | `app/w/[workspaceId]/calendar/page.tsx`, `components/calendar/EventDialog.tsx` | FullCalendar v7 월/주 보기, AI 일정 ✨ 표시, 취소 일정 회색(기본 숨김), 날짜 클릭 추가, 끌어서 날짜 이동, 수정/취소/삭제 팝업 |
| 할 일 | `app/w/[workspaceId]/todos/page.tsx` | 추가(담당자·마감일), 완료 체크, 담당자 변경, D-day, 진행률, 탭 필터 |
| 설정 | `app/w/[workspaceId]/settings/page.tsx` | 이름, AI on/off, 필터 모드 3종, 민감도 1~3, 멤버 목록, 초대 링크. owner 아니면 잠금, 403 안내 |
| 대시보드 | `app/dashboard/page.tsx` | `public/reports/*.csv`를 읽어 지표별 버전 막대그래프 + 목표 점선 + 표. CSV가 없으면 "예시 데이터" 표시 |

**확인한 것**: `npm run lint` 통과, `npm run build` 통과, 데모 화면 6개를 헤드리스 브라우저로 스크린샷 찍어 확인.
실제 서버(FastAPI)와 붙여서는 아직 확인하지 못했다.

**참고 (FullCalendar)**: 설치된 `@fullcalendar/react`가 v7이라 플러그인을 `@fullcalendar/react/daygrid`처럼 하위 경로에서 가져온다.
`package.json`에 남아 있는 `@fullcalendar/core`, `daygrid` 등 v6 패키지는 안 쓴다 (정리는 파트 1과 상의).

### 변경 사항

커밋을 파일 단위로 나눠서 올렸다. 전체 diff는 `git log -p main..smartshark9319`로 볼 수 있다.

```
acb5b7e style: 파스텔 테마 색상과 폰트 토큰 추가
6b1842d style: 한글 폰트(Noto Sans KR, Jua) 적용
6554681 feat: 데모용 더미 데이터 보강 (워크스페이스, 멤버, 채널, 일정, 할 일)
330af5f fix: 데모 욕설 흉내가 'ㅅ1발'도 잡도록 수정
7f57b8e feat: 날짜·색·에러 문구 도우미 추가
a1ccc04 feat: 파스텔 아바타 컴포넌트 추가
86a5e9e feat: 공통 입력창(Input, Select, Field) 컴포넌트 추가
130567b feat: 공통 팝업(Dialog) 컴포넌트 추가
0b110ff feat: 워크스페이스 데이터 Provider 추가 (데모/실서버 공통)
309ddd2 feat: 사이드바(채널 목록, 채널 추가, 초대 링크, 메뉴) 추가
4fda1bf feat: 워크스페이스 레이아웃에 Provider와 사이드바 연결
8125eb0 feat: 워크스페이스 첫 화면에서 첫 채널로 이동
cd5dffa feat: 욕설 가림 UI (mask/warn/notify_admin, 보기, 욕설 아님 신고)
16b726e feat: 메시지 입력창 디자인, Enter 전송(한글 조합 중 방지), 자동 높이
418ff2e feat: 말풍선 메시지 목록 (날짜 구분선, 묶어 보기, 무한 스크롤, 욕설 신고)
0867af5 feat: AI 일정 카드 (추가/변경/취소, 수정 폼, 무시)
a825b5f feat: 오른쪽 패널 (다가오는 일정, 내 할 일)
0430a7b feat: 채팅 화면 (실시간/데모, AI 카드 타임라인, 신고, 오른쪽 일정 패널)
1aeeb46 feat: 일정 추가/수정/취소/삭제 팝업
92af405 feat: 캘린더 화면 (월/주 보기, AI 일정 표시, 끌어서 날짜 이동)
647fc52 feat: 할 일 화면 (추가, 담당자, 마감일, 완료 체크, 진행률)
6135199 feat: 설정 화면 (AI on/off, 필터 모드·민감도, 멤버, 초대 링크)
1cbcf38 feat: 로그인·온보딩용 브랜드 카드 컴포넌트
e612f8b feat: 로그인/회원가입 화면
0c8d016 feat: 온보딩 화면 (워크스페이스 만들기, 대화 분석 동의, 초대 코드 참가)
7e84b4a feat: 초대 링크 참가 화면
7328984 feat: 첫 화면 자동 이동 + 소개 화면 + 데모 바로가기
67a0d40 feat: AI 성능 대시보드 (버전별 막대그래프, 목표선, 표 보기, CSV 없으면 예시)
a5d66a4 fix: 데모 설정 저장 시 타입 오류 수정
6919dcd style: 할 일 담당자 선택칸 너비 넓히기
eeb76dd style: 캘린더 이중 테두리 제거
```

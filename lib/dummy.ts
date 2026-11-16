// 서버 없이 화면을 만들 때 쓰는 가짜 데이터. 모양은 실제 API와 같아요.
import type { Event, Message, Suggestion, Todo } from "@/lib/api";

export const dummyMessages: Message[] = [
  { id: 1, channel_id: 1, user_id: 1, user_name: "민준", text: "회의 언제 할까? 화요일 어때?", created_at: "2026-10-12T21:05:00+09:00", is_profane: false, profanity_spans: [] },
  { id: 2, channel_id: 1, user_id: 2, user_name: "서연", text: "난 화요일 학원ㅠ 목요일 7시는?", created_at: "2026-10-12T21:06:00+09:00", is_profane: false, profanity_spans: [] },
  { id: 3, channel_id: 1, user_id: 3, user_name: "지호", text: "ㅅ1발 나 또 늦게 봤네", created_at: "2026-10-12T21:07:00+09:00", is_profane: true, profanity_spans: [[0, 3]] },
  { id: 4, channel_id: 1, user_id: 1, user_name: "민준", text: "그럼 목 7시 디코로 확정", created_at: "2026-10-12T21:08:00+09:00", is_profane: false, profanity_spans: [] },
];

export const dummySuggestions: Suggestion[] = [
  {
    id: 1, channel_id: 1, action: null, created_at: "2026-10-12T21:08:10+09:00",
    payload: {
      kind: "add", message_ids: [2, 4],
      event: { title: "팀 회의", date: "2026-10-15", weekday: "목", start: "19:00:00", location: "디스코드", status: "confirmed", attendees: ["민준", "서연", "지호"], absent: [] },
    },
  },
];

export const dummyEvents: Event[] = [
  { id: 1, workspace_id: 1, title: "팀 회의", date: "2026-10-15", start: "19:00:00", location: "디스코드", attendees: ["민준", "서연", "지호"], absent: [], status: "confirmed", source: "ai" },
];

export const dummyTodos: Todo[] = [
  { id: 1, workspace_id: 1, title: "발표 자료 초안", assignee_id: 1, due_date: "2026-10-20", done: false },
];

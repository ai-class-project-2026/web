// 서버 없이 화면을 만들 때 쓰는 가짜 데이터. 모양은 실제 API와 같아요.
// 주소에 워크스페이스 id 대신 "demo"를 넣으면(/w/demo/c/1) 이 데이터로 모든 화면이 돌아가요.
import type { Channel, Event, Member, Message, Suggestion, Todo, User, Workspace } from "@/lib/api";

export const DEMO_ID = "demo";

export const dummyMe: User = { id: 1, name: "민준", email: "minjun@example.com" };

export const dummyWorkspace: Workspace = {
  id: 1, name: "과학탐구 팀플", invite_code: "demo", ai_schedule_on: true, filter_mode: "mask", filter_level: 2,
};

export const dummyMembers: Member[] = [
  { user_id: 1, name: "민준", role: "owner" },
  { user_id: 2, name: "서연", role: "member" },
  { user_id: 3, name: "지호", role: "member" },
  { user_id: 4, name: "하은", role: "member" },
];

export const dummyChannels: Channel[] = [
  { id: 1, workspace_id: 1, name: "일반" },
  { id: 2, workspace_id: 1, name: "자료조사" },
];

const msg = (id: number, channel_id: number, user_id: number, text: string, created_at: string, profanity_spans: number[][] | null = null): Message => ({
  id, channel_id, user_id, text, created_at,
  user_name: dummyMembers.find((m) => m.user_id === user_id)!.name,
  is_profane: profanity_spans !== null,
  profanity_spans: profanity_spans ?? [],
});

export const dummyMessages: Message[] = [
  msg(1, 1, 1, "다음 회의 언제 할까? 화요일 어때?", "2026-11-16T21:05:00+09:00"),
  msg(2, 1, 2, "난 화요일 학원ㅠ 목요일 7시는?", "2026-11-16T21:06:00+09:00"),
  msg(3, 1, 3, "ㅅ1발 나 또 늦게 봤네", "2026-11-16T21:07:00+09:00", [[0, 3]]),
  msg(4, 1, 4, "난 목요일 안 돼ㅠㅠ 회의록 꼭 올려줘", "2026-11-16T21:07:30+09:00"),
  msg(5, 1, 3, "난 목 7시 ㄱㄴ 근데 10분 늦을 듯", "2026-11-16T21:07:50+09:00"),
  msg(6, 1, 1, "그럼 목 7시 디코로 확정!", "2026-11-16T21:08:00+09:00"),
  msg(7, 1, 2, "토요일 리허설 일요일 3시로 미루면 안 될까?", "2026-11-17T09:12:00+09:00"),
  msg(8, 1, 1, "ㅇㅋ 다들 괜찮으면 일요일 3시로 하자", "2026-11-17T09:13:00+09:00"),
  msg(9, 1, 4, "좋아 👍", "2026-11-17T09:14:00+09:00"),
  // AI 모델이 잡은 경우: spans가 비어 있으면 메시지 전체를 가려요
  msg(10, 1, 3, "아 진짜 tlqkf 과제 너무 많아", "2026-11-17T09:16:00+09:00", []),
  // "시발점"은 욕이 아니라서 통과
  msg(11, 1, 3, "시발점부터 다시 정리해볼게", "2026-11-17T09:17:00+09:00"),
  msg(12, 2, 2, "논문 3개 찾았어! 링크 올릴게", "2026-11-16T18:00:00+09:00"),
  msg(13, 2, 4, "고마워 나는 실험 사진 정리할게 📷", "2026-11-16T18:03:00+09:00"),
];

export const dummySuggestions: Suggestion[] = [
  {
    id: 1, channel_id: 1, action: null, created_at: "2026-11-16T21:08:10+09:00",
    payload: {
      kind: "add", message_ids: [2, 5, 6],
      event: { title: "팀 회의", date: "2026-11-19", weekday: "목", start: "19:00:00", location: "디스코드", status: "confirmed", attendees: ["민준", "서연", "지호"], absent: ["하은"], note: "지호 10분 늦게 합류" },
    },
  },
  {
    id: 2, channel_id: 1, action: null, created_at: "2026-11-17T09:14:10+09:00",
    payload: {
      kind: "update", event_id: 2, message_ids: [7, 8, 9],
      event: { title: "중간 발표 리허설", date: "2026-11-22", weekday: "일", start: "15:00:00", location: "스터디카페", status: "confirmed", attendees: ["민준", "서연", "지호", "하은"], absent: [] },
    },
  },
];

export const dummyEvents: Event[] = [
  { id: 1, workspace_id: 1, title: "팀 회의", date: "2026-11-12", start: "19:00:00", location: "디스코드", attendees: ["민준", "서연", "지호", "하은"], absent: [], status: "confirmed", source: "ai" },
  { id: 2, workspace_id: 1, title: "중간 발표 리허설", date: "2026-11-21", start: "14:00:00", location: "스터디카페", attendees: ["민준", "서연", "지호", "하은"], absent: [], status: "confirmed", source: "manual" },
  { id: 3, workspace_id: 1, title: "자료 조사 마감", date: "2026-11-24", start: null, time_text: "자정 전", attendees: [], absent: [], status: "confirmed", source: "manual" },
  { id: 4, workspace_id: 1, title: "팀 회의", date: "2026-11-10", start: "20:00:00", location: "디스코드", attendees: ["민준", "서연"], absent: [], status: "cancelled", source: "ai" },
  { id: 5, workspace_id: 1, title: "최종 발표", date: "2026-12-03", start: "10:00:00", location: "3층 강의실", attendees: ["민준", "서연", "지호", "하은"], absent: [], status: "confirmed", source: "manual" },
];

export const dummyTodos: Todo[] = [
  { id: 1, workspace_id: 1, title: "발표 자료 초안", assignee_id: 1, due_date: "2026-11-20", done: false },
  { id: 2, workspace_id: 1, title: "참고 논문 3개 요약", assignee_id: 2, due_date: "2026-11-19", done: false },
  { id: 3, workspace_id: 1, title: "실험 사진 정리", assignee_id: 4, due_date: "2026-11-18", done: true },
  { id: 4, workspace_id: 1, title: "회의록 템플릿 만들기", assignee_id: 3, due_date: null, done: false },
  { id: 5, workspace_id: 1, title: "최종 보고서 목차 짜기", assignee_id: null, due_date: "2026-11-28", done: false },
];

// 데모에서 직접 보낸 메시지를 가려 보기 위한 아주 단순한 욕설 흉내 (진짜 판정은 서버 /moderate가 해요)
const DEMO_BAD = /ㅅ\s*[1l!]?\s*ㅂ|[시씨쉬]\s*[0-9@.!*]*\s*[발빨팔]|tlqkf|sibal|ㅂ\s*ㅅ|병\s*[1!]?\s*신|개\s*새\s*[끼기]/gi;
const DEMO_OK = ["시발점", "시발역"];

export function demoModerate(text: string): Pick<Message, "is_profane" | "profanity_spans"> {
  const spans: number[][] = [];
  for (const m of text.matchAll(DEMO_BAD)) {
    const s = m.index;
    if (DEMO_OK.some((w) => text.startsWith(w, s))) continue;
    spans.push([s, s + m[0].length]);
  }
  return { is_profane: spans.length > 0, profanity_spans: spans };
}

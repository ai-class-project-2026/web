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

/** 데모에 나오는 모든 사람 (여러 프로젝트에 걸쳐 있어요) */
export const dummyPeople: User[] = [
  dummyMe,
  { id: 2, name: "서연", email: "seoyeon@example.com" },
  { id: 3, name: "지호", email: "jiho@example.com" },
  { id: 4, name: "하은", email: "haeun@example.com" },
  { id: 5, name: "도윤", email: "doyun@example.com" },
  { id: 6, name: "수아", email: "sua@example.com" },
  { id: 7, name: "예린", email: "yerin@example.com" },
];

const msg = (id: number, channel_id: number, user_id: number, text: string, created_at: string, profanity_spans: number[][] | null = null): Message => ({
  id, channel_id, user_id, text, created_at,
  user_name: dummyPeople.find((p) => p.id === user_id)!.name,
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
const DEMO_BAD = /[시씨쉬ㅅ]\s*[0-9l@.!*]*\s*[발빨팔ㅂ]|tlqkf|sibal|ㅂ\s*ㅅ|병\s*[1!]?\s*신|개\s*새\s*[끼기]/gi;
const DEMO_OK = ["시발점", "시발역"];

export function demoModerate(text: string): Pick<Message, "is_profane" | "profanity_spans"> {
  const spans: number[][] = [];
  for (const m of text.matchAll(DEMO_BAD)) {
    const s = m.index;
    if (DEMO_OK.some((w) => text.startsWith(w, s))) continue;
    // 서버처럼 글자(코드포인트) 번호로 맞춰요: 이모지는 1글자
    const from = Array.from(text.slice(0, s)).length;
    spans.push([from, from + Array.from(m[0]).length]);
  }
  return { is_profane: spans.length > 0, profanity_spans: spans };
}

/* ───────────── 여러 프로젝트(워크스페이스) ─────────────
 * 데모 주소: /w/demo (= 1번), /w/demo-2, /w/demo-3
 */

export type DemoProject = {
  workspace: Workspace;
  members: Member[];
  channels: Channel[];
  messages: Message[];
  suggestions: Suggestion[];
  events: Event[];
  todos: Todo[];
};

export const demoProjects: DemoProject[] = [
  {
    workspace: dummyWorkspace, members: dummyMembers, channels: dummyChannels,
    messages: dummyMessages, suggestions: dummySuggestions, events: dummyEvents, todos: dummyTodos,
  },
  {
    workspace: { id: 2, name: "캡스톤 디자인", invite_code: "demo-2", ai_schedule_on: true, filter_mode: "warn", filter_level: 2 },
    members: [
      { user_id: 5, name: "도윤", role: "owner" },
      { user_id: 1, name: "민준", role: "member" },
      { user_id: 6, name: "수아", role: "member" },
      { user_id: 2, name: "서연", role: "member" },
    ],
    channels: [
      { id: 21, workspace_id: 2, name: "일반" },
      { id: 22, workspace_id: 2, name: "디자인-시안" },
    ],
    messages: [
      msg(201, 21, 5, "와이어프레임 1차 올렸어요! 피드백 부탁해요", "2026-11-16T14:00:00+09:00"),
      msg(202, 21, 6, "확인했어요 👀 버튼 색만 조금 더 밝게 하면 좋을 듯", "2026-11-16T14:05:00+09:00"),
      msg(203, 21, 1, "금요일 오후 4시에 멘토링 있는 거 맞죠?", "2026-11-16T14:10:00+09:00"),
      msg(204, 21, 5, "네 맞아요, 공학관 302호!", "2026-11-16T14:11:00+09:00"),
      msg(205, 22, 2, "로고 시안 3개 만들어 봤어요", "2026-11-15T20:00:00+09:00"),
    ],
    suggestions: [],
    events: [
      { id: 21, workspace_id: 2, title: "멘토링", date: "2026-11-20", start: "16:00:00", location: "공학관 302호", attendees: ["도윤", "민준", "수아", "서연"], absent: [], status: "confirmed", source: "ai" },
      { id: 22, workspace_id: 2, title: "중간 데모 제출", date: "2026-11-27", start: "23:59:00", attendees: [], absent: [], status: "confirmed", source: "manual" },
    ],
    todos: [
      { id: 21, workspace_id: 2, title: "와이어프레임 피드백 반영", assignee_id: 1, due_date: "2026-11-19", done: false },
      { id: 22, workspace_id: 2, title: "사용자 인터뷰 질문지", assignee_id: 6, due_date: "2026-11-21", done: false },
    ],
  },
  {
    workspace: { id: 3, name: "영어 스터디", invite_code: "demo-3", ai_schedule_on: false, filter_mode: "mask", filter_level: 1 },
    members: [
      { user_id: 7, name: "예린", role: "owner" },
      { user_id: 1, name: "민준", role: "member" },
      { user_id: 4, name: "하은", role: "member" },
    ],
    channels: [{ id: 31, workspace_id: 3, name: "일반" }],
    messages: [
      msg(301, 31, 7, "이번 주 단어 시험 범위는 Day 11~15예요", "2026-11-17T08:00:00+09:00"),
      msg(302, 31, 4, "넵! 토요일 10시 스카에서 봐요 📚", "2026-11-17T08:05:00+09:00"),
    ],
    suggestions: [],
    events: [
      { id: 31, workspace_id: 3, title: "단어 시험", date: "2026-11-21", start: "10:00:00", location: "스터디카페", attendees: ["예린", "민준", "하은"], absent: [], status: "confirmed", source: "manual" },
    ],
    todos: [{ id: 31, workspace_id: 3, title: "Day 11~15 외우기", assignee_id: 1, due_date: "2026-11-21", done: false }],
  },
];

/** 주소의 워크스페이스 부분이 데모인지: "demo" → 1, "demo-2" → 2, 아니면 null */
export function demoWorkspaceId(param: string): number | null {
  if (param === DEMO_ID) return 1;
  const m = /^demo-(\d+)$/.exec(param);
  return m ? Number(m[1]) : null;
}

export function demoPath(workspaceId: number) {
  return workspaceId === 1 ? `/w/${DEMO_ID}` : `/w/demo-${workspaceId}`;
}

/* ───────────── 1:1 대화 (DM) ─────────────
 * 데모 주소: /dm/demo (목록), /dm/demo-2 (서연과의 대화)
 * DM 메시지의 channel_id는 상대 id에 마이너스를 붙인 값으로 구분해요 (데모 전용 규칙).
 */

export const dummyDMs: Record<number, Message[]> = {
  2: [
    msg(901, -2, 2, "민준아 발표 자료 템플릿 어디 있어?", "2026-11-17T10:00:00+09:00"),
    msg(902, -2, 1, "드라이브 '팀플' 폴더에 있어! 링크 보내줄게", "2026-11-17T10:02:00+09:00"),
    msg(903, -2, 2, "고마워 🙏 오늘 밤까지 1~3장 채워둘게", "2026-11-17T10:03:00+09:00"),
  ],
  5: [
    msg(911, -5, 5, "멘토링 전에 10분 일찍 만나서 맞춰볼래요?", "2026-11-16T22:00:00+09:00"),
    msg(912, -5, 1, "좋아요! 3시 50분에 302호 앞에서 봐요", "2026-11-16T22:01:00+09:00"),
  ],
  3: [
    msg(921, -3, 3, "아 ㅅㅂ 과제 제출 링크 안 열려", "2026-11-17T11:00:00+09:00", [[2, 4]]),
  ],
};

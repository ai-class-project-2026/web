// 화면 여기저기서 쓰는 작은 도우미 함수들 (날짜 표시, 색 고르기, 에러 문구)

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** "2026-11-19" → Date (시간대 영향 없이 그 날짜 그대로) */
export function parseDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Date → "2026-11-19" */
export function toDateStr(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function todayStr() {
  return toDateStr(new Date());
}

export function weekdayOf(date: string) {
  return WEEKDAYS[parseDate(date).getDay()];
}

/** "2026-11-19" → "11/19(목)" */
export function shortDate(date: string, weekday?: string | null) {
  const d = parseDate(date);
  return `${d.getMonth() + 1}/${d.getDate()}(${weekday || WEEKDAYS[d.getDay()]})`;
}

/** "19:00:00" → "19:00" */
export function hhmm(start?: string | null) {
  return start ? start.slice(0, 5) : "";
}

/** 일정 시각 글자: 숫자 시간이 없으면 "점심시간" 같은 원문 표현 */
export function timeLabel(e: { start?: string | null; time_text?: string | null }) {
  return hhmm(e.start) || e.time_text || "";
}

/** 메시지 시각 "오후 9:05" */
export function clock(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
}

/** 날짜 구분선 "11월 16일 월요일" */
export function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });
}

/** 마감일까지 남은 날: "D-3", "D-Day", "D+2" */
export function dDay(date: string) {
  const diff = Math.round((parseDate(date).getTime() - parseDate(todayStr()).getTime()) / 86400000);
  return { diff, label: diff === 0 ? "D-Day" : diff > 0 ? `D-${diff}` : `D+${-diff}` };
}

/** 목적격 조사: 받침 있으면 "을", 없으면 "를", 판단이 안 되면(영어·이모지·자모 등) "을(를)". 끝의 공백·닫는 따옴표/괄호는 건너뛰고 봐요 */
export function eulReul(word: string) {
  const ch = word.replace(/[\s"'”’)\]}」』〉》]+$/, "").at(-1) ?? "";
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 ? "을" : "를";
  if (/[0-9]/.test(ch)) return "013678".includes(ch) ? "을" : "를"; // 영·일·삼·육·칠·팔 / 이·사·오·구
  return "을(를)";
}

/** 사람마다 고정된 연한 색 (아바타, 담당자 표시) */
const PASTELS = ["bg-lavender", "bg-mint", "bg-peach", "bg-pink", "bg-sky", "bg-butter"];
export function pastel(id: number) {
  return PASTELS[Math.abs(id) % PASTELS.length];
}

// 서버가 영어로 보내는 안내를 쉬운 한국어로 바꿔요
const KO_DETAIL: Record<string, string> = {
  "Todo not found": "이 할 일은 이미 지워졌어요",
  "Event not found": "이 일정은 이미 지워졌어요",
  "Event was deleted": "이 일정은 이미 지워졌어요",
  "Channel not found": "이 채널은 없거나 지워졌어요",
  "Workspace not found": "이 프로젝트를 찾을 수 없어요",
  "Message not found": "이 메시지는 없거나 지워졌어요",
  "Suggestion not found": "이 카드는 이미 사라졌어요",
  "Invalid token": "로그인이 만료됐어요. 다시 로그인해 주세요",
  "Already handled": "이미 다른 사람이 처리한 카드예요",
  "Assignee is not a member": "담당자가 이 프로젝트 멤버가 아니에요",
  "Request body too large": "내용이 너무 길어요",
  // 말로 고치기/추가하기
  "Instruction not understood": "무슨 뜻인지 잘 모르겠어요. 예: 8시로 바꿔줘, 장소는 도서관",
  "Ignore the card to drop it": "이 일정을 없애려면 [무시]를 눌러 주세요",
  "Cancel the event in the calendar": "일정을 취소하려면 캘린더에서 그 일정을 열어 [일정 취소]를 눌러 주세요",
  "Cancel cards cannot be revised": "취소 카드는 말로 고칠 수 없어요",
  "Date is in the past": "지난 날짜로는 정할 수 없어요",
  "Invalid event": "그렇게 바꾸면 일정이 맞지 않아요. [수정]으로 고쳐 주세요",
  "Instruction already running": "앞의 요청을 처리하고 있어요. 잠시만요",
};

// 말로 고친 칸 이름 → 화면에서 부르는 이름 (start와 time_text는 둘 다 "시간", attendees와 absent는 "참석")
const CHANGED_KO: Record<string, string> = {
  title: "제목", date: "날짜", start: "시간", time_text: "시간", location: "장소", attendees: "참석", absent: "참석", note: "메모",
};

/** ["start", "location"] → "시간·장소" (같은 이름은 한 번만) */
export function changedLabel(fields: string[]) {
  return [...new Set(fields.map((f) => CHANGED_KO[f]).filter(Boolean))].join("·");
}

// 입력 검사(422)에 걸린 칸: 서버 필드 이름 → 화면에서 부르는 이름
const FIELD_KO: Record<string, string> = {
  text: "메시지는",
  name: "이름은",
  title: "제목은",
  location: "장소는",
  note: "메모는",
  time_text: "시간은",
  password: "비밀번호는",
};

/** 서버 입력 검사 결과 하나를 한국어로. 제한 숫자는 서버 문구에서 꺼내요 (제한 값은 서버 schemas.py에만 둬요) */
function validationText(e: { type?: string; loc?: unknown[]; msg?: string }) {
  const field = FIELD_KO[String(e.loc?.at(-1))];
  const n = e.msg?.match(/\d+/)?.[0];
  const subject = field ? `${field} ` : "";
  if (e.type === "string_too_long") return n ? `${subject}${n}자까지 쓸 수 있어요` : `${subject}너무 길어요`;
  if (e.type === "string_too_short") {
    if (n && n !== "1") return `${subject}${n}자 이상 입력해 주세요`;
    return field ? `${field} 비워 둘 수 없어요` : "내용을 입력해 주세요";
  }
  return "입력한 내용을 확인해 주세요";
}

/** API 에러를 사람이 읽을 문구로. error.detail이 문자열이면 한국어로 바꿔서(모르는 영어 안내는 기본 문구), 입력 검사(422) 목록이면 고칠 점을 한국어로, 아니면 기본 문구 */
export function errorText(error: unknown, fallback = "잠시 후 다시 시도해 주세요") {
  const detail = (error as { detail?: unknown } | undefined)?.detail;
  if (typeof detail === "string") {
    if (KO_DETAIL[detail]) return KO_DETAIL[detail];
    if (/ not found$/i.test(detail)) return "찾을 수 없어요. 이미 지워졌는지 확인해 주세요";
    return /[가-힣]/.test(detail) ? detail : fallback; // 우리가 만든 한국어 안내(OFFLINE)만 그대로 보여 줘요
  }
  if (Array.isArray(detail) && detail[0]) return validationText(detail[0]);
  return fallback;
}

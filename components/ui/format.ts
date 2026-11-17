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

/** 사람마다 고정된 파스텔 색 (아바타, 담당자 표시) */
const PASTELS = ["bg-lavender", "bg-mint", "bg-peach", "bg-pink", "bg-sky", "bg-butter"];
export function pastel(id: number) {
  return PASTELS[Math.abs(id) % PASTELS.length];
}

/** API 에러를 사람이 읽을 문구로. error.detail이 문자열이면 그대로, 아니면 기본 문구 */
export function errorText(error: unknown, fallback = "잠시 후 다시 시도해 주세요") {
  const detail = (error as { detail?: unknown } | undefined)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
  return fallback;
}

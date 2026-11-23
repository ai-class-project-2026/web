/**
 * Split text into plain/hidden parts by profanity_spans, for the masked bubble.
 * 서버가 보내는 spans는 파이썬 글자(코드포인트) 번호예요. 자바스크립트 문자열은 이모지를
 * 2칸으로 세기 때문에, 글자 배열로 바꿔서 자르고 다시 붙여요.
 */
export function splitSpans(text: string, spans: number[][]) {
  const chars = Array.from(text);
  // 범위를 벗어났거나 거꾸로/빈 구간처럼 믿을 수 없는 값이 하나라도 있으면 일부만 가리지 않고 통째로 가려요
  if (spans.length > 0 && !spansAreValid(text, spans)) return [{ text, hidden: true }];
  const parts: { text: string; hidden: boolean }[] = [];
  let i = 0;
  for (const [s, e] of [...spans].sort((a, b) => a[0] - b[0])) {
    if (s > i) parts.push({ text: chars.slice(i, s).join(""), hidden: false });
    if (e > Math.max(s, i)) parts.push({ text: chars.slice(Math.max(s, i), e).join(""), hidden: true });
    i = Math.max(i, e);
  }
  if (i < chars.length) parts.push({ text: chars.slice(i).join(""), hidden: false });
  return parts;
}

/**
 * 서버가 준 가림 구간을 믿어도 되는지 검사해요.
 * 구간마다 [시작, 끝]이 정수이고 0 <= 시작 < 끝 <= 글자 수여야 해요. 하나라도 어긋나면 false.
 * (구간이 하나도 없는 것도 "가릴 곳을 모른다"는 뜻이라 false예요)
 */
export function spansAreValid(text: string, spans: unknown): spans is number[][] {
  if (!Array.isArray(spans) || spans.length === 0) return false;
  const n = Array.from(text).length;
  return spans.every(
    (sp) =>
      Array.isArray(sp) && sp.length === 2 && Number.isInteger(sp[0]) && Number.isInteger(sp[1]) && sp[0] >= 0 && sp[0] < sp[1] && sp[1] <= n,
  );
}

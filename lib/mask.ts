/** Split text into plain/hidden parts by profanity_spans, for the masked bubble. */
export function splitSpans(text: string, spans: number[][]) {
  const parts: { text: string; hidden: boolean }[] = [];
  let i = 0;
  for (const [s, e] of [...spans].sort((a, b) => a[0] - b[0])) {
    if (s > i) parts.push({ text: text.slice(i, s), hidden: false });
    if (e > Math.max(s, i)) parts.push({ text: text.slice(Math.max(s, i), e), hidden: true });
    i = Math.max(i, e);
  }
  if (i < text.length) parts.push({ text: text.slice(i), hidden: false });
  return parts;
}

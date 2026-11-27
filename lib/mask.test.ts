import assert from "node:assert/strict";
import { test } from "node:test";
import { demoModerate } from "./dummy.ts";
import { splitSpans, spansAreValid, tooProfane } from "./mask.ts";

test("splitSpans hides only the spans", () => {
  assert.deepEqual(splitSpans("아 씨@발 진짜", [[2, 5]]), [
    { text: "아 ", hidden: false },
    { text: "씨@발", hidden: true },
    { text: " 진짜", hidden: false },
  ]);
  assert.deepEqual(splitSpans("ab", []), [{ text: "ab", hidden: false }]);
  // overlapping / unsorted spans don't duplicate text
  const parts = splitSpans("abcdef", [[3, 5], [1, 4]]);
  assert.equal(parts.map((p) => p.text).join(""), "abcdef");
});

test("splitSpans counts emoji as one character (server uses code-point offsets)", () => {
  const parts = splitSpans("\u{1F600}\u{1F600} 시발", [[3, 5]]);
  assert.deepEqual(parts, [
    { text: "\u{1F600}\u{1F600} ", hidden: false },
    { text: "시발", hidden: true },
  ]);
});

test("demoModerate uses code-point offsets like the server", () => {
  const text = "\u{1F600}\u{1F600} 시발";
  const { profanity_spans } = demoModerate(text);
  assert.deepEqual(profanity_spans, [[3, 5]]);
  assert.equal(splitSpans(text, profanity_spans).find((p) => p.hidden)?.text, "시발");
});

test("malformed spans hide the whole message (no word left visible)", () => {
  const text = "아 씨발 진짜";
  const bad: unknown[][] = [
    [[2, 99]], // 범위 밖
    [[-1, 3]], // 음수
    [[5, 2]], // 거꾸로
    [[3, 3]], // 길이 0
    [null], // null 구간
    [[2, 4], [9, 12]], // 하나만 나빠도 전체
    [[1.5, 3]], // 정수 아님
    [["2", "4"]],
  ];
  for (const spans of bad) {
    assert.equal(spansAreValid(text, spans), false, JSON.stringify(spans));
    const parts = splitSpans(text, spans as number[][]);
    assert.deepEqual(parts, [{ text, hidden: true }], JSON.stringify(spans));
  }
  assert.equal(spansAreValid(text, [[2, 4]]), true);
  assert.equal(spansAreValid(text, [[0, 6]]), true);
  assert.equal(spansAreValid(text, []), false);
});

test("tooProfane: 3 or more hidden places, or more than half of the letters", () => {
  assert.equal(tooProfane("개웃기네", [[0, 1]]), false);
  assert.equal(tooProfane("아 씨발 진짜", [[2, 4]]), false); // 5글자 중 2글자
  assert.equal(tooProfane("개꿀", [[0, 1]]), false); // 딱 절반은 아직 아니에요
  assert.equal(tooProfane("아 씨발", [[2, 4]]), true); // 3글자 중 2글자
  assert.equal(tooProfane("씨발 병신아 진짜 왜 그러는 거야", [[0, 2], [3, 5]]), false); // 2곳, 절반 아래
  assert.equal(tooProfane("개웃겨 씨발 진짜 병신아 오늘 회의 몇 시였지", [[0, 1], [4, 6], [10, 12]]), true); // 3곳
  assert.equal(tooProfane("\u{1F600}\u{1F600}\u{1F600} 시발", [[4, 6]]), false); // 이모지도 한 글자
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { splitSpans } from "./mask.ts";

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

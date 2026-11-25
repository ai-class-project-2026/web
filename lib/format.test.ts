import assert from "node:assert/strict";
import { test } from "node:test";
import { changedLabel, eulReul } from "../components/ui/format.ts";

test("eulReul picks 을/를 from the last character", () => {
  const cases: [string, string][] = [
    ["발표 자료 회의", "를"], // 받침 없음
    ["보고서 정리", "를"],
    ["중간 점검", "을"], // 받침 있음
    ["회의록", "을"],
    ["2차 회의 3", "을"], // 삼
    ["과제 2", "를"], // 이
    ["10", "을"], // 십 → 끝자리 0(영)으로도 을
    ["3시 회의 (2차)", "를"], // 닫는 괄호 건너뜀 → 차
    ["“중간 점검”", "을"], // 닫는 따옴표 건너뜀
    ['"보고서 정리"', "를"],
    ["중간 점검  ", "을"], // 뒤 공백
    ["API", "을(를)"], // 영어는 모름
    ["회의 \u{1F600}", "을(를)"], // 이모지
    ["ㅋㅋ", "을(를)"], // 자모만
    ["회의!!", "을(를)"],
    ["", "을(를)"], // 빈 제목
    ["  ", "을(를)"],
  ];
  for (const [word, want] of cases) assert.equal(eulReul(word), want, JSON.stringify(word));
});

test("changedLabel names each changed field once", () => {
  assert.equal(changedLabel(["start", "location"]), "시간·장소");
  assert.equal(changedLabel(["attendees", "absent"]), "참석"); // 참석/불참은 한 칸
  assert.equal(changedLabel(["time_text", "start", "date"]), "시간·날짜");
  assert.equal(changedLabel(["weekday"]), ""); // 모르는 칸은 빼요
});

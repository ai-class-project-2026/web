import assert from "node:assert/strict";
import { test } from "node:test";
import { safeNext } from "./safe-next.ts";

const O = "http://localhost:3021";
const BS = String.fromCharCode(92); // 역슬래시 한 글자

test("safeNext blocks every way to leave the site", () => {
  for (const n of [
    "/" + BS + "evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "/\r/evil.example",
    "/\t" + BS + "evil.example",
    "/\n" + BS + "evil.example",
    "//evil.example",
    "https://evil.example/x",
    BS + BS + "evil.example",
    "javascript:alert(1)",
    " //evil.example",
    "/.//evil.example",
    "/a/..//evil.example",
  ]) {
    assert.equal(safeNext(n, O), "/", JSON.stringify(n));
  }
});

test("safeNext keeps same-site paths", () => {
  assert.equal(safeNext("/invite/abc", O), "/invite/abc");
  assert.equal(safeNext("/w/1/c/2?x=1#y", O), "/w/1/c/2?x=1#y");
  assert.equal(safeNext(null, O), "/");
  assert.equal(safeNext("", O), "/");
  assert.equal(safeNext(`${O}/me`, O), "/me");
});

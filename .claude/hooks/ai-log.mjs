// Claude Code hook (UserPromptSubmit + Stop): logs each prompt, the answer,
// and the code changed during that turn to ai-sessions/<part>/<date>_<session>.md.
// Set your part once per clone: git config ai.part part3
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const MAX_DIFF = 200_000; // ponytail: hard cap so one huge diff can't bloat the log

try {
  const input = JSON.parse(fs.readFileSync(0, "utf8"));
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd;
  const git = (args) => {
    try {
      return execSync(`git ${args}`, { cwd: root, encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] }).trimEnd();
    } catch (e) {
      return (e.stdout ?? "").trimEnd(); // diff --no-index exits 1 when files differ
    }
  };
  const untracked = () => git("ls-files --others --exclude-standard").split("\n").filter((f) => f && !f.startsWith("ai-sessions/"));
  const now = new Date();
  const statePath = path.join(os.tmpdir(), `ai-log-${input.session_id}.json`);
  let state = {};
  try { state = JSON.parse(fs.readFileSync(statePath, "utf8")); } catch {}

  if (!state.log) {
    const part = git("config ai.part") || "unknown";
    state.log = path.join(root, "ai-sessions", part, `${now.toLocaleDateString("sv")}_${input.session_id.slice(0, 8)}.md`);
    fs.mkdirSync(path.dirname(state.log), { recursive: true });
    if (!fs.existsSync(state.log)) {
      fs.writeFileSync(state.log, `# AI 세션 ${input.session_id}\n\n- 파트: ${part}\n- 작성자: ${git("config user.name")}\n- 도구: Claude Code\n- 브랜치: ${git("branch --show-current")}\n`);
    }
  }
  const append = (text) => fs.appendFileSync(state.log, text);
  const time = now.toLocaleTimeString("sv");

  if (input.hook_event_name === "UserPromptSubmit") {
    state.snap = git("stash create") || git("rev-parse HEAD");
    state.untracked = untracked();
    append(`\n---\n\n## 프롬프트 · ${time}\n\n${input.prompt}\n`);
  } else if (input.hook_event_name === "Stop") {
    const answer = input.last_assistant_message || lastAnswer(input.transcript_path);
    append(`\n### 결과 · ${time}\n\n${answer || "(답변 없음)"}\n`);

    const snap = state.snap || git("rev-parse HEAD");
    const parts = [snap ? git(`diff ${snap} -- . ":(exclude)ai-sessions"`) : ""];
    const before = new Set(state.untracked ?? []);
    for (const f of untracked().filter((f) => !before.has(f))) parts.push(git(`diff --no-index -- /dev/null "${f}"`));
    let diff = parts.filter(Boolean).join("\n");
    if (diff.length > MAX_DIFF) diff = diff.slice(0, MAX_DIFF) + `\n... (${diff.length - MAX_DIFF}자 생략)`;
    append(`\n### 변경 사항\n\n${diff ? "`````diff\n" + diff + "\n`````" : "(코드 변경 없음)"}\n`);

    state.snap = git("stash create") || git("rev-parse HEAD");
    state.untracked = untracked();
  }
  fs.writeFileSync(statePath, JSON.stringify(state));
} catch (e) {
  console.error(`ai-log: ${e.message}`); // never block the session
}

// Fallback for Claude Code versions whose Stop input lacks last_assistant_message.
function lastAnswer(file) {
  if (!file || !fs.existsSync(file)) return "";
  const entries = fs.readFileSync(file, "utf8").split("\n").flatMap((l) => {
    try { return [JSON.parse(l)]; } catch { return []; }
  });
  const out = [];
  for (const e of entries.reverse()) {
    const c = e.message?.content;
    if (e.type === "user" && !e.isMeta && !(Array.isArray(c) && c.some((b) => b.type === "tool_result"))) break;
    if (e.type === "assistant" && Array.isArray(c)) out.unshift(...c.filter((b) => b.type === "text").map((b) => b.text));
  }
  return out.join("\n\n");
}

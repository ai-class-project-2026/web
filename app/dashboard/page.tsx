"use client";

// AI 성능 대시보드: server의 eval/reports/schedule.csv, moderation.csv를 public/reports/에 복사해 두면
// fetch("/reports/schedule.csv")로 읽어서 버전(label)별 점수를 막대그래프로 보여줘요.
// 파일이 아직 없으면 "예시 데이터"로 화면 모양만 보여줘요.
//
// 지표마다 그래프를 따로 그려요(한 그래프에 축 두 개 X). 점선은 기획서 4.2의 목표치예요.

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "cn";
import { Select } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { IconBack, IconCheck, IconDashboard, IconNext } from "@/components/ui/icons";

type Row = Record<string, string>;
type Metric = { key: string; title: string; target: number; lowerBetter?: boolean; unit: "%" | "ms" };

const SOURCES = {
  schedule: {
    title: "일정 AI",
    file: "/reports/schedule.csv",
    metrics: [
      { key: "confirmed_f1", title: "확정 일정 F1", target: 0.9, unit: "%" },
      { key: "false_registration", title: "오등록률", target: 0.05, lowerBetter: true, unit: "%" },
      { key: "cancel_recall", title: "취소 감지율", target: 0.85, unit: "%" },
      { key: "date_accuracy", title: "날짜 정확도", target: 0.9, unit: "%" },
    ] as Metric[],
    sample: `label,testset,n,confirmed_f1,false_registration,cancel_recall,date_accuracy
qwen2.5-3b 제로샷,real_test.jsonl,120,0.58,0.21,0.42,0.71
상용 LLM 제로샷,real_test.jsonl,120,0.81,0.09,0.74,0.88
v1 LoRA,real_test.jsonl,120,0.84,0.07,0.79,0.95
v2 LoRA+보강,real_test.jsonl,120,0.91,0.04,0.88,0.97`,
  },
  moderation: {
    title: "욕설 AI",
    file: "/reports/moderation.csv",
    metrics: [
      { key: "f1", title: "F1", target: 0.9, unit: "%" },
      { key: "false_positive_rate", title: "오탐률", target: 0.03, lowerBetter: true, unit: "%" },
      { key: "ms_per_msg", title: "응답 시간", target: 100, lowerBetter: true, unit: "ms" },
    ] as Metric[],
    sample: `label,testset,n,f1,false_positive_rate,ms_per_msg
사전 필터,test_C_human,150,0.41,0.06,2
v1 KcELECTRA,test_C_human,150,0.78,0.04,38
v2 증강+화이트리스트,test_C_human,150,0.86,0.02,41
사전 필터,test_D_fp,100,0.0,0.09,2
v1 KcELECTRA,test_D_fp,100,0.0,0.05,37
v2 증강+화이트리스트,test_D_fp,100,0.0,0.02,40`,
  },
};
type SourceKey = keyof typeof SOURCES;

/** CSV 칸의 숫자. 비어 있거나 숫자가 아니면 null(= 측정 안 함). Number("")은 0이라서 따로 걸러요 */
function num(v: string | undefined, unit: Metric["unit"] = "%"): number | null {
  if (v === undefined || v.trim() === "") return null;
  const n = Number(v);
  // Infinity나 음수(-500%)처럼 점수가 될 수 없는 값은 "측정 안 함"으로 봐요. 비율(%)은 0~1 사이만 인정해요.
  if (!Number.isFinite(n) || n < 0) return null;
  if (unit === "%" && n > 1) return null;
  return n;
}

/** 따옴표("…")로 감싼 칸 안의 쉼표·줄바꿈·""(따옴표 한 개)를 지켜서 CSV를 읽어요. 빈 줄은 건너뛰어요 */
function parseCsv(text: string): Row[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      rows.push(row); row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const [head, ...lines] = rows.filter((r) => r.some((v) => v.trim() !== ""));
  if (!head) return [];
  const cols = head.map((h) => h.trim());
  return lines.map((l) => Object.fromEntries(cols.map((c, i) => [c, (l[i] ?? "").trim()])));
}

export default function DashboardPage() {
  const [tab, setTab] = useState<SourceKey>("schedule");
  const [data, setData] = useState<Record<SourceKey, { rows: Row[]; sample: boolean }> | null>(null);

  useEffect(() => {
    const load = async (k: SourceKey) => {
      try {
        const res = await fetch(SOURCES[k].file, { cache: "no-store" });
        if (res.ok) {
          const rows = parseCsv(await res.text());
          if (rows.length) return { rows, sample: false };
        } else {
          // 본문을 안 읽고 두면 연결이 열린 채로 남아요 (404 안내 페이지도 본문이 있어요)
          await res.body?.cancel();
        }
      } catch {}
      return { rows: parseCsv(SOURCES[k].sample), sample: true };
    };
    Promise.all([load("schedule"), load("moderation")]).then(([schedule, moderation]) => setData({ schedule, moderation }));
  }, []);

  const src = SOURCES[tab];
  const cur = data?.[tab];
  const testsets = [...new Set(cur?.rows.map((r) => r.testset) ?? [])];
  const [pick, setPick] = useState<string>("");
  const testset = testsets.includes(pick) ? pick : testsets[0];
  const rows = cur?.rows.filter((r) => r.testset === testset) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4 md:px-5">
      <header className="flex items-start gap-3">
        <Link href="/" className="mt-0.5 rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="처음으로">
          <IconBack className="size-5" />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl"><IconDashboard className="size-6" aria-hidden />AI 성능 대시보드</h1>
          <p className="text-sm text-muted-foreground">버전이 바뀔 때마다 점수가 얼마나 좋아졌는지 보여줘요</p>
        </div>
      </header>

      {/* 필터는 그래프 위 한 줄에 */}
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={tab} onChange={setTab} options={(Object.keys(SOURCES) as SourceKey[]).map((k) => ({ value: k, label: SOURCES[k].title }))} />
        {testsets.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            테스트셋
            <Select value={testset} onChange={(e) => setPick(e.target.value)} className="w-auto py-1.5 text-foreground">
              {testsets.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </label>
        )}
        {cur?.sample && (
          <span className="rounded-sm bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground" title={`server의 eval/reports/*.csv를 public/reports/에 복사하면 진짜 점수로 바뀌어요`}>
            예시 데이터 · 실제 CSV를 public{src.file}에 넣어 주세요
          </span>
        )}
      </div>

      {!data ? (
        <p className="py-20 text-center text-muted-foreground">불러오는 중…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {src.metrics
              .filter((m) => rows.some((r) => { const v = num(r[m.key], m.unit); return v !== null && (v > 0 || m.lowerBetter); }))
              .map((m) => (
                <BarChart
                  key={m.key}
                  metric={m}
                  rows={rows.flatMap((r) => { const v = num(r[m.key], m.unit); return v === null ? [] : [{ label: r.label || "(이름 없음)", value: v }]; })}
                />
              ))}
          </div>

          <details className="group rounded-xl border bg-card text-sm">
            {/* 줄 전체가 눌리는 자리예요. 브라우저 기본 세모 대신 우리 아이콘을 써요 */}
            <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-xl px-4 py-3 font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
              <IconNext className="size-4 text-muted-foreground group-open:rotate-90" aria-hidden />
              표로 보기
            </summary>
            <div className="overflow-x-auto px-4 pb-3">
              {/* 숫자는 오른쪽으로 맞춰야 자릿수끼리 비교하기 쉬워요 */}
              <table className="w-full whitespace-nowrap text-right tabular-nums">
                <thead className="whitespace-normal break-keep align-bottom text-muted-foreground">
                  <tr>
                    <th className="py-2 text-left font-normal">버전</th>
                    <th className="py-2 pl-3 font-normal">n</th>
                    {src.metrics.map((m) => <th key={m.key} className="py-2 pl-3 font-normal">{m.title}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="min-w-28 whitespace-normal break-words py-2 text-left">{r.label || "(이름 없음)"}</td>
                      <td className="py-2 pl-3">{r.n}</td>
                      {src.metrics.map((m) => <td key={m.key} className="py-2 pl-3">{fmt(num(r[m.key], m.unit), m.unit)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </main>
  );
}

function fmt(v: number | null, unit: Metric["unit"]) {
  if (v === null || Number.isNaN(v)) return "-";
  return unit === "%" ? `${(v * 100).toFixed(1)}%` : `${Math.round(v)}ms`;
}

/** 버전별 막대 하나씩 + 목표 점선. 막대에 마우스를 올리면 값이 떠요. 마지막(최신) 버전만 값을 바로 적어요.
 *  막대와 선만 SVG로 그리고 글자는 그 위에 따로 얹어요. 그래야 칸이 좁아져도 글자 크기가 그대로예요. */
function BarChart({ metric: m, rows }: { metric: Metric; rows: { label: string; value: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  // PAD_T는 막대 위에 값을 적을 자리예요
  const W = 360, H = 150, PAD_T = 24;
  const base = H - 1;
  const plotH = base - PAD_T;
  const max = Math.max(m.target, ...rows.map((r) => r.value)) || 1;
  const slot = W / Math.max(rows.length, 1);
  const bw = Math.min(44, slot * 0.55);
  const y = (v: number) => base - (v / max) * plotH;
  const lastIndex = rows.length - 1;
  const last = rows.at(-1);
  const met = last && (m.lowerBetter ? last.value <= m.target : last.value >= m.target);
  const shown = hover ?? lastIndex;

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="min-w-0 truncate text-base">{m.title}</h2>
        <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          <span className="tabular-nums">목표 {m.lowerBetter ? "≤" : "≥"} {fmt(m.target, m.unit)}</span>
          {last && <span className={cn("inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-medium", met ? "bg-chart-2/20 text-foreground" : "bg-muted")}>{met && <IconCheck className="size-4" aria-hidden />}{met ? "달성" : "아직"}</span>}
        </span>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">{m.lowerBetter ? "낮을수록 좋아요" : "높을수록 좋아요"}</p>

      <div className="flex">
        <div className="relative min-w-0 flex-1">
          <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={`${m.title} 버전별 막대그래프`}>
            {/* 바닥선 */}
            <line x1={0} x2={W} y1={base} y2={base} stroke="var(--border)" />
            {/* 목표 점선 */}
            <line x1={0} x2={W} y1={y(m.target)} y2={y(m.target)} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeWidth={1.5} />
            {rows.map((r, i) => {
              const top = y(r.value);
              const h = base - top;
              const x0 = slot * i + (slot - bw) / 2;
              const rad = Math.min(4, h);
              // 위쪽 모서리만 둥근 막대 (바닥은 평평하게)
              const d = `M${x0},${base} V${top + rad} Q${x0},${top} ${x0 + rad},${top} H${x0 + bw - rad} Q${x0 + bw},${top} ${x0 + bw},${top + rad} V${base} Z`;
              const isLast = i === lastIndex;
              return (
                <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  {/* 막대보다 넓은 마우스 영역 */}
                  <rect x={slot * i} y={0} width={slot} height={H} fill="transparent" />
                  <path d={d} fill={isLast ? "var(--chart-1)" : "var(--muted-foreground)"} opacity={hover === null || hover === i ? (isLast ? 1 : 0.45) : 0.25} />
                </g>
              );
            })}
          </svg>
          {/* 값은 막대 바로 위에. 막대가 많아 좁을 땐 그래프 밖으로 나가지 않게 안쪽으로 당겨요 */}
          {rows[shown] && (
            <span
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-sm bg-card px-1 text-sm font-semibold leading-tight tabular-nums"
              style={{ left: `clamp(1.75rem, ${((shown + 0.5) / rows.length) * 100}%, 100% - 1.75rem)`, top: `${((y(rows[shown].value) - 3) / H) * 100}%` }}
            >
              {fmt(rows[shown].value, m.unit)}
            </span>
          )}
        </div>
        {/* 점선이 끝나는 자리 옆에 이름을 적어요. 막대나 값과 겹치지 않아요 */}
        <div className="relative w-8 shrink-0">
          <span className="absolute left-1.5 -translate-y-1/2 whitespace-nowrap text-xs text-muted-foreground" style={{ top: `${(y(m.target) / H) * 100}%` }}>목표</span>
        </div>
      </div>

      {/* 버전 이름: 막대와 같은 너비로 나눠서 바로 아래에 와요. 길면 두 줄까지 보여줘요 */}
      <div className="mr-8 mt-1.5 grid text-center text-xs leading-tight text-muted-foreground" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>
        {rows.map((r, i) => (
          <span key={i} title={r.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={cn("line-clamp-2 text-balance break-keep break-words px-0.5", i === lastIndex && "font-medium text-foreground")}>
            {r.label}
          </span>
        ))}
      </div>
    </section>
  );
}

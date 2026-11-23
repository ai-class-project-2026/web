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
import { IconBack, IconCheck, IconDashboard } from "@/components/ui/icons";

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
          <h1 className="flex items-center gap-2 text-2xl"><IconDashboard className="size-5" aria-hidden />AI 성능 대시보드</h1>
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

          <details className="rounded-xl border bg-card p-4 text-sm">
            <summary className="cursor-pointer font-medium">표로 보기</summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left font-mono tabular-nums">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="py-1.5 pr-4 font-sans font-normal">버전</th>
                    <th className="py-1.5 pr-4 font-sans font-normal">n</th>
                    {src.metrics.map((m) => <th key={m.key} className="py-1.5 pr-4 font-sans font-normal">{m.title}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-1.5 pr-4 font-sans">{r.label || "(이름 없음)"}</td>
                      <td className="py-1.5 pr-4 tabular-nums">{r.n}</td>
                      {src.metrics.map((m) => <td key={m.key} className="py-1.5 pr-4 tabular-nums">{fmt(num(r[m.key], m.unit), m.unit)}</td>)}
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

/** 버전별 막대 하나씩 + 목표 점선. 막대에 마우스를 올리면 값이 떠요. 마지막(최신) 버전만 값을 바로 적어요. */
function BarChart({ metric: m, rows }: { metric: Metric; rows: { label: string; value: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 360, H = 200, PAD_L = 8, PAD_B = 34, PAD_T = 24;
  const max = Math.max(m.target, ...rows.map((r) => r.value)) * 1.15 || 1;
  const plotH = H - PAD_B - PAD_T;
  const slot = (W - PAD_L * 2) / Math.max(rows.length, 1);
  const bw = Math.min(44, slot * 0.55);
  const y = (v: number) => PAD_T + plotH - (v / max) * plotH;
  const last = rows.at(-1);
  const met = last && (m.lowerBetter ? last.value <= m.target : last.value >= m.target);

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h2 className="text-base">{m.title}</h2>
        <span className="text-xs text-muted-foreground">
          목표 {m.lowerBetter ? "≤" : "≥"} {fmt(m.target, m.unit)}
          {last && <span className={cn("ml-2 inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-medium", met ? "bg-chart-2/20 text-foreground" : "bg-muted")}>{met && <IconCheck className="size-4" aria-hidden />}{met ? "달성" : "아직"}</span>}
        </span>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">{m.lowerBetter ? "낮을수록 좋아요" : "높을수록 좋아요"}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${m.title} 버전별 막대그래프`}>
        {/* 바닥선 */}
        <line x1={PAD_L} x2={W - PAD_L} y1={PAD_T + plotH} y2={PAD_T + plotH} stroke="var(--border)" />
        {/* 목표 점선 */}
        <line x1={PAD_L} x2={W - PAD_L} y1={y(m.target)} y2={y(m.target)} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeWidth={1.5} />
        <text x={W - PAD_L} y={y(m.target) - 4} textAnchor="end" fontSize={10} fill="var(--muted-foreground)">목표</text>

        {rows.map((r, i) => {
          const cx = PAD_L + slot * i + slot / 2;
          const top = y(r.value);
          const h = PAD_T + plotH - top;
          const x0 = cx - bw / 2;
          const rad = Math.min(4, h);
          // 위쪽 모서리만 둥근 막대 (바닥은 평평하게)
          const d = `M${x0},${PAD_T + plotH} V${top + rad} Q${x0},${top} ${x0 + rad},${top} H${x0 + bw - rad} Q${x0 + bw},${top} ${x0 + bw},${top + rad} V${PAD_T + plotH} Z`;
          const isLast = i === rows.length - 1;
          const show = hover === i || (hover === null && isLast);
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {/* 막대보다 넓은 마우스 영역 */}
              <rect x={cx - slot / 2} y={PAD_T} width={slot} height={plotH} fill="transparent" />
              <path d={d} fill={isLast ? "var(--chart-1)" : "var(--muted-foreground)"} opacity={hover === null || hover === i ? (isLast ? 1 : 0.45) : 0.25} />
              {show && (
                <text x={cx} y={top - 6} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--foreground)" fontFamily="var(--font-mono)">
                  {fmt(r.value, m.unit)}
                </text>
              )}
              <text x={cx} y={H - PAD_B + 16} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
                {r.label.length > 12 ? `${r.label.slice(0, 11)}…` : r.label}
                <title>{r.label}</title>
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

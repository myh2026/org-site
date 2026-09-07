"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// 真实产物查看器：journal.jsonl（管道分隔事件时间线）/ events.jsonl（55 事件全集，
// 可按事件名过滤）/ report.md / scorecard.json 四个视图共用终端窗口外壳；
// journal/events 按事件类型着色、时间戳转为相对毫秒偏移。
// ---------------------------------------------------------------------------

interface Meta {
  task: string;
  model: string;
  elapsed: number;
  events: number;
}

type ViewKey = "journal" | "events" | "report" | "scorecard";

const VIEWS: Array<{ k: ViewKey; label: string }> = [
  { k: "journal", label: "journal.jsonl" },
  { k: "events", label: "events.jsonl" },
  { k: "report", label: "report.md" },
  { k: "scorecard", label: "scorecard.json" },
];

// journal 事件分类着色（与 ORG 监督回路阶段语义一致）
function classify(
  event: string,
  detail: string,
): { label: string; cls: string } {
  if (event === "route")
    return { label: "route", cls: "border-sky-500/40 bg-sky-500/10 text-sky-400" };
  if (event === "mint-register")
    return { label: "mint", cls: "border-violet-500/40 bg-violet-500/10 text-violet-400" };
  if (event === "re-dispatch")
    return { label: "re-dispatch", cls: "border-amber-500/40 bg-amber-500/10 text-amber-400" };
  if (event === "review") {
    if (detail.includes("verdict=Accept"))
      return { label: "review·accept", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" };
    if (detail.includes("verdict=Revise"))
      return { label: "review·revise", cls: "border-amber-500/40 bg-amber-500/10 text-amber-400" };
  }
  if (event === "dispatch") return { label: "dispatch", cls: "border-zinc-700 bg-zinc-900 text-zinc-400" };
  if (event === "worker-done")
    return { label: "done", cls: "border-zinc-700 bg-zinc-900 text-zinc-500" };
  if (event === "clarify") return { label: "clarify", cls: "border-amber-500/40 bg-amber-500/10 text-amber-400" };
  if (event === "answer") return { label: "answer", cls: "border-zinc-700 bg-zinc-900 text-zinc-500" };
  return { label: event, cls: "border-zinc-700 bg-zinc-900 text-zinc-500" };
}

// events.jsonl：事件名徽标着色（与 journal 视图的分类徽标互补——这里按引擎事件名分层）
const EVENT_CLS: Record<string, string> = {
  run_start: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  run_end: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  journal: "border-zinc-700 bg-zinc-900 text-zinc-500",
  node: "border-sky-500/40 bg-sky-500/10 text-sky-400",
  capability_granted: "border-violet-500/40 bg-violet-500/10 text-violet-400",
  score_evidence: "border-teal-500/40 bg-teal-500/10 text-teal-400",
  crystallize_frozen: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  fixtures_mined: "border-violet-500/40 bg-violet-500/10 text-violet-400",
};

function eventCls(name: string): string {
  return EVENT_CLS[name] ?? "border-zinc-700 bg-zinc-900 text-zinc-500";
}

// capability mode 三态着色（auto/confirm/deny 之外 orchestrated = 由主控托管）
function modeCls(mode: string): string {
  if (mode === "auto") return "text-emerald-400";
  if (mode === "confirm") return "text-amber-400";
  if (mode === "deny") return "text-red-400";
  return "text-violet-300";
}

interface EventRow {
  seq: number;
  offset: number | null;
  name: string;
  data: Record<string, unknown>;
}

function basename(p: string): string {
  const i = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
  return i >= 0 ? p.slice(i + 1) : p;
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

// 每种事件名的 data 摘要定制渲染（返回 JSX 段；key 由调用方提供）
function EventSummary({ row }: { row: EventRow }) {
  const d = row.data;
  switch (row.name) {
    case "run_start":
      if (d.entry !== undefined)
        return (
          <span className="min-w-0 flex-1 truncate text-zinc-400">
            <span className="text-zinc-600">entry=</span>
            <span className="text-zinc-500">{basename(fmt(d.entry))}</span>{" "}
            <span className="text-zinc-600">model=</span>
            <span className="text-emerald-400">{fmt(d.model)}</span>{" "}
            <span className="text-zinc-600">task=</span>
            <span className="text-zinc-300">「{fmt(d.task)}」</span>{" "}
            <span className="text-zinc-600">scale=</span>
            <span className="text-zinc-400">{fmt(d.scale)}</span>
          </span>
        );
      return (
        <span className="min-w-0 flex-1 truncate text-zinc-400">
          <span className="text-zinc-600">mission=</span>
          <span className="text-zinc-300">「{fmt(d.mission)}」</span>
        </span>
      );
    case "journal":
      return (
        <span className="min-w-0 flex-1 truncate text-zinc-400">
          <span className="text-emerald-500/80">{fmt(d.name)}</span>
          {d.detail !== undefined && (
            <>
              <span className="text-zinc-700"> · </span>
              {fmt(d.detail)}
            </>
          )}
        </span>
      );
    case "node":
      return (
        <span className="min-w-0 flex-1 truncate text-zinc-400">
          <span className="text-zinc-500">{fmt(d.graph)}</span>
          <span className="text-zinc-700"> › </span>
          <span className="text-sky-300">{fmt(d.node)}</span>
          {d.initialized === true && <span className="text-zinc-600"> initialized</span>}
        </span>
      );
    case "capability_granted":
      return (
        <span className="min-w-0 flex-1 truncate text-zinc-400">
          <span className="text-violet-300">{fmt(d.capability)}</span>
          <span className="text-zinc-700"> · </span>
          <span className={`font-semibold ${modeCls(fmt(d.mode))}`}>{fmt(d.mode)}</span>
        </span>
      );
    case "score_evidence":
      return (
        <span className="min-w-0 flex-1 truncate text-zinc-400">
          <span className="text-zinc-500">{fmt(d.axis)}</span>
          <span className="text-zinc-700"> × </span>
          <span className="text-zinc-500">{fmt(d.task_class)}</span>
          <span className="text-zinc-700"> · </span>
          <span className="text-zinc-600">{fmt(d.kind)}</span>
          <span className="text-zinc-700"> = </span>
          <span className="text-teal-300 tabular-nums">{fmt(d.value)}</span>
        </span>
      );
    case "crystallize_frozen":
      return (
        <span className="min-w-0 flex-1 truncate text-zinc-400">
          <span className="text-amber-300">{fmt(d.node)}</span>
          {d.input !== undefined && (
            <>
              <span className="text-zinc-700"> ← </span>
              <span className="text-zinc-400">“{fmt(d.input)}”</span>
            </>
          )}
        </span>
      );
    case "fixtures_mined":
      return (
        <span className="min-w-0 flex-1 truncate text-zinc-400">
          <span className="text-teal-300 tabular-nums">{fmt(d.entries)}</span>
          <span className="text-zinc-600"> entries · </span>
          <span className="text-teal-300 tabular-nums">{fmt(d.tracks)}</span>
          <span className="text-zinc-600"> tracks → </span>
          <span className="text-zinc-500">{fmt(d.path)}</span>
        </span>
      );
    case "run_end":
      return (
        <span className="min-w-0 flex-1 truncate text-zinc-400">
          <span className="text-zinc-600">elapsed=</span>
          <span className="tabular-nums text-zinc-300">{fmt(d.elapsed_ms)}ms</span>
          <span className="text-zinc-700"> · </span>
          <span className="text-emerald-400">ok={fmt(d.ok)}</span>
        </span>
      );
    default:
      return (
        <span className="min-w-0 flex-1 truncate text-zinc-500">
          {JSON.stringify(d)}
        </span>
      );
  }
}

const PHASE_CLS: Record<string, string> = {
  decompose: "text-emerald-500",
  route: "text-sky-500",
  supervise: "text-violet-500",
  kernel: "text-emerald-500",
  router: "text-sky-500",
  supervisor: "text-violet-500",
  pool: "text-zinc-400",
  factory: "text-violet-400",
};

function phaseCls(name: string): string {
  return PHASE_CLS[name] ?? "text-zinc-500";
}

export function ReplayViewer({
  journal,
  events,
  report,
  scorecard,
  meta,
}: {
  journal: string;
  events: string;
  report: string;
  scorecard: string;
  meta: Meta;
}) {
  const [view, setView] = useState<ViewKey>("journal");
  // events 视图：按事件名过滤（null = 全部；点击头部统计 chip 切换）
  const [evFilter, setEvFilter] = useState<string | null>(null);

  // journal 解析：seq|ts|phase|actor|event|detail；时间戳转相对偏移
  const lines = journal.trim().split("\n");
  const stamps = lines.map((line) => {
    const ts = (line.split("|")[1] ?? "").trim();
    const t = Date.parse(ts);
    return Number.isFinite(t) ? t : NaN;
  });
  const baseTs = stamps.find((v) => !Number.isNaN(v)) ?? 0;
  const rows = lines.map((line, i) => {
    const parts = line.split("|");
    const seq = parts[0] ?? String(i + 1);
    const phase = (parts[2] ?? "").split(":"); // "3:supervise"
    const actor = parts[3] ?? "";
    const event = parts[4] ?? "";
    const detail = parts.slice(5).join("|");
    const t = stamps[i];
    const offset = Number.isNaN(t) ? null : t - baseTs;
    return {
      seq,
      offset,
      phaseNo: phase[0] ?? "",
      phaseName: phase[1] ?? "",
      actor,
      event,
      detail,
    };
  });

  // events.jsonl 解析：每行 {seq, ts, name, data}；时间戳转相对偏移
  const evLines = events.trim() ? events.trim().split("\n") : [];
  const evStamps = evLines.map((line) => {
    const t = Date.parse(line.slice(0, 220));
    return Number.isFinite(t) ? t : NaN;
  });
  const evBase = evStamps.find((v) => !Number.isNaN(v)) ?? 0;
  const evRows: EventRow[] = evLines.map((line, i) => {
    let name = "";
    let data: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(line) as { name?: string; data?: Record<string, unknown> };
      name = parsed.name ?? "";
      data = parsed.data ?? {};
    } catch {
      // 单行损坏不影响其余行
    }
    const t = evStamps[i];
    return {
      seq: i,
      offset: Number.isNaN(t) ? null : t - evBase,
      name,
      data,
    };
  });
  // 事件名统计（按首次出现排序）
  const evCounts: Array<{ name: string; count: number }> = [];
  for (const r of evRows) {
    const hit = evCounts.find((c) => c.name === r.name);
    if (hit) hit.count += 1;
    else evCounts.push({ name: r.name, count: 1 });
  }
  const evShown = evFilter === null ? evRows : evRows.filter((r) => r.name === evFilter);

  // scorecard 解析
  let sc: {
    model?: string;
    evidence_count?: number;
    cells?: Array<{ cell: string; score: number; confidence: number }>;
  } = {};
  try {
    sc = JSON.parse(scorecard);
  } catch {
    // 缺省为空
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* 运行元信息条 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-t-xl border border-zinc-800 border-b-0 bg-zinc-900/40 px-4 py-2.5 font-mono text-[11.5px]">
        <span className="flex items-center gap-1.5 text-emerald-500">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          run {meta.model}
        </span>
        <span className="text-zinc-500">
          elapsed <span className="text-zinc-300">{meta.elapsed}ms</span>
        </span>
        <span className="text-zinc-500">
          events <span className="text-zinc-300">{meta.events}</span>
        </span>
        <span className="min-w-0 flex-1 truncate text-zinc-600">task「{meta.task}」</span>
      </div>

      {/* 终端窗口 */}
      <div className="overflow-hidden rounded-b-xl border border-zinc-800 bg-[#0c1210]">
        {/* tab 栏 */}
        <div
          role="tablist"
          aria-label="选择产物视图"
          className="flex items-center gap-1 overflow-x-auto border-b border-zinc-800/80 bg-black/25 px-2 py-1.5"
        >
          {VIEWS.map((v) => {
            const on = view === v.k;
            return (
              <button
                key={v.k}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setView(v.k)}
                className={`shrink-0 rounded-md px-2.5 py-1 font-mono text-[11.5px] transition-colors ${
                  on
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                }`}
              >
                {v.label}
              </button>
            );
          })}
          <span className="ml-auto hidden shrink-0 pr-1.5 font-mono text-[10.5px] text-zinc-600 sm:inline">
            dist/demo/out-a · v0.4.0 快照
          </span>
        </div>

        {view === "journal" && (
          <div
            role="tabpanel"
            aria-label="journal 事件时间线"
            className="scrollbar-thin max-h-[460px] overflow-y-auto p-3 font-mono text-[11.5px] leading-[1.9]"
          >
            {rows.map((r) => {
              const kind = classify(r.event, r.detail);
              return (
                <div
                  key={r.seq}
                  className="flex items-baseline gap-2 whitespace-nowrap px-1 transition-colors hover:bg-white/[0.03]"
                >
                  <span className="w-5 shrink-0 text-right text-zinc-700">{r.seq}</span>
                  <span className="w-12 shrink-0 text-right tabular-nums text-zinc-700">
                    {r.offset === null ? "·" : `+${r.offset}ms`}
                  </span>
                  <span className={`hidden w-[86px] shrink-0 truncate sm:inline ${phaseCls(r.phaseName)}`}>
                    {r.phaseNo}:{r.phaseName}
                  </span>
                  <span className="hidden w-[74px] shrink-0 truncate text-zinc-500 md:inline">
                    {r.actor}
                  </span>
                  <span
                    className={`shrink-0 rounded border px-1 py-px text-[10px] leading-tight ${kind.cls}`}
                  >
                    {kind.label}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-zinc-400" title={r.detail}>
                    {r.detail}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {view === "events" && (
          <div role="tabpanel" aria-label="events 全事件流">
            {/* 事件名统计过滤 chips：点击过滤，再点取消 */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-800/80 bg-black/15 px-3 py-2">
              <button
                type="button"
                aria-pressed={evFilter === null}
                onClick={() => setEvFilter(null)}
                className={`rounded border px-1.5 py-px font-mono text-[10.5px] transition-colors ${
                  evFilter === null
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                全部 {evRows.length}
              </button>
              {evCounts.map((c) => {
                const on = evFilter === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setEvFilter(on ? null : c.name)}
                    className={`rounded border px-1.5 py-px font-mono text-[10.5px] transition-colors ${
                      on ? eventCls(c.name) : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {c.name} {c.count}
                  </button>
                );
              })}
              <span className="ml-auto font-mono text-[10.5px] text-zinc-600">
                {evShown.length}/{evRows.length} events
              </span>
            </div>
            <div className="scrollbar-thin max-h-[460px] overflow-y-auto p-3 font-mono text-[11.5px] leading-[1.9]">
              {evShown.map((r) => (
                <div
                  key={r.seq}
                  className="flex items-baseline gap-2 whitespace-nowrap px-1 transition-colors hover:bg-white/[0.03]"
                >
                  <span className="w-5 shrink-0 text-right text-zinc-700 tabular-nums">{r.seq}</span>
                  <span className="w-12 shrink-0 text-right tabular-nums text-zinc-700">
                    {r.offset === null ? "·" : `+${r.offset}ms`}
                  </span>
                  <span
                    className={`w-[132px] shrink-0 truncate rounded border px-1 py-px text-[10px] leading-tight ${eventCls(r.name)}`}
                    title={r.name}
                  >
                    {r.name}
                  </span>
                  <EventSummary row={r} />
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "report" && (
          <div
            role="tabpanel"
            aria-label="report 交付报告"
            className="scrollbar-thin max-h-[460px] overflow-auto p-4 font-mono text-[12px] leading-[1.85]"
          >
            {report.trim().split("\n").map((line, i) => {
              if (line.startsWith("## "))
                return (
                  <p key={i} className="mt-3 font-semibold text-zinc-100 first:mt-0">
                    {line}
                  </p>
                );
              if (line.startsWith("# "))
                return (
                  <p key={i} className="font-semibold text-emerald-500">
                    {line}
                  </p>
                );
              if (line.startsWith("- "))
                return (
                  <p key={i} className="whitespace-pre text-zinc-400">
                    <span className="select-none text-emerald-600/70">· </span>
                    {line.slice(2)}
                  </p>
                );
              if (!line.trim())
                return <div key={i} className="h-2" />;
              return <p key={i} className="whitespace-pre-wrap text-zinc-500">{line}</p>;
            })}
          </div>
        )}

        {view === "scorecard" && (
          <div
            role="tabpanel"
            aria-label="scorecard 模型评分卡"
            className="scrollbar-thin max-h-[460px] overflow-auto p-4 font-mono text-[12px]"
          >
            <p className="text-zinc-500">
              model <span className="text-zinc-200">{sc.model ?? "—"}</span> · evidence_count{" "}
              <span className="text-emerald-400">{sc.evidence_count ?? "—"}</span>
              <span className="ml-2 text-zinc-600">（跨运行累计账本）</span>
            </p>
            <div className="mt-3 overflow-hidden rounded-lg border border-zinc-800">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-800 bg-black/25 text-[10.5px] uppercase tracking-widest text-zinc-600">
                    <th className="px-3 py-2 font-medium">cell（能力轴 × 任务类）</th>
                    <th className="px-3 py-2 font-medium">score</th>
                    <th className="px-3 py-2 font-medium">conf</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {(sc.cells ?? []).map((c) => {
                    const [axis, task] = c.cell.split("|");
                    return (
                      <tr key={c.cell} className="transition-colors hover:bg-white/[0.03]">
                        <td className="px-3 py-2">
                          <span className="text-zinc-300">{axis}</span>
                          <span className="text-zinc-600"> × </span>
                          <span className="text-zinc-500">{task}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-2">
                            <span
                              className={`tabular-nums ${
                                c.score >= 0.9
                                  ? "text-emerald-400"
                                  : c.score >= 0.5
                                    ? "text-amber-400"
                                    : "text-zinc-400"
                              }`}
                            >
                              {(c.score * 100).toFixed(1)}%
                            </span>
                            <span className="h-1 w-16 overflow-hidden rounded-full bg-zinc-800">
                              <span
                                className="block h-full rounded-full bg-emerald-500/70"
                                style={{ width: `${Math.round(c.score * 100)}%` }}
                              />
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-2 tabular-nums text-zinc-500">{c.confidence}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
              judgment 0% 为 scripted 模式下的如实记录——模型缺席的判定轴不虚标；客观证据
              （fixture 通过率 / 裁决率 / 预算遵守）结构性优先于裁判打分。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

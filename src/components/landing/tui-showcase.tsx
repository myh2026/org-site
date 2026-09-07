"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { SectionHeading } from "./section-heading";

// ---------------------------------------------------------------------------
// TUI 展示区：按 tui-spec §1 三区布局（左栏 会话/专家库/池/固化 + 主区事件流 +
// 底栏输入与状态）做分步状态机动画，循环演示一次任务流：
// 输入 → 分解卡片（A/B/C 徽标）→ 工厂五步 stepper → Revise→Accept → 完成卡
// 下方演示控制条：播放/暂停/重播 + 进度拖拽 + 事件类型过滤（对应产品 :filter）
// ---------------------------------------------------------------------------

// 事件类型过滤键（与引擎事件类别一一对应）
type FilterKey = "all" | "task" | "plan" | "factory" | "review" | "direct" | "done";

const FILTERS: Array<{ k: FilterKey; label: string }> = [
  { k: "all", label: "全部" },
  { k: "task", label: "任务" },
  { k: "plan", label: "分解" },
  { k: "factory", label: "工厂" },
  { k: "review", label: "裁决" },
  { k: "direct", label: "直连" },
  { k: "done", label: "汇总" },
];

const TASK = "抓取某站点近一周公告，输出结构化表格";

// 动画刻度表（1 tick ≈ 110ms）
const T = {
  typed: TASK.length, // 0..19 输入中
  sent: 21, // 回车 → 任务卡出现，输入清空
  decompose: 24, // org 任务分解卡
  task1: 27,
  task2: 30,
  task3: 33,
  factory: 37, // 工厂卡出现，step0 当前
  stepTick: 4, // 每 4 tick 走一步
  stepsDone: 37 + 5 * 4 + 2, // 59：五步全 ✓
  revise: 63,
  accept: 72,
  summary: 79, // run A 完成（成本衰减首段）
  ask: 87, // 直连卡（多轮 · 记账 · 纪要回写）
  handoff: 96, // 暖移交卡（D 移交徽标）
  decay: 104, // 成本衰减完整序列
  hold: 124, // 停留
  reset: 130, // 循环
} as const;

const STEP_LABELS = ["规格", "生成", "check", "验收", "登记 git"];

const ROUTE_BADGE: Record<string, string> = {
  A: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  B: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  C: "border-violet-500/40 bg-violet-500/10 text-violet-400",
  D: "border-sky-500/40 bg-sky-500/10 text-sky-400",
};

const VERDICT_BADGE: Record<string, string> = {
  Accept: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  Revise: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  Reject: "border-red-500/40 bg-red-500/10 text-red-400",
  Escalate: "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-400",
};

// 徽标语义（与 hsl/router/policy.hsl · contracts/contract.hsl 一致）
const ROUTE_SEMANTIC: Record<string, string> = {
  A: "内联",
  B: "复用",
  C: "生成",
  D: "移交",
};

const VERDICT_SEMANTIC: Record<string, string> = {
  Accept: "收货",
  Revise: "返工",
  Reject: "重派",
  Escalate: "仲裁",
};

const RAIL = {
  sessions: [
    { dot: "●", label: "公告三连跑", active: true },
    { dot: "○", label: "直连·ask", active: false },
    { dot: "○", label: "演示 replay", active: false },
  ],
  experts: ["notice-parser", "record-valid…", "notice-parse…"],
};

export function TuiShowcase() {
  const [t, setT] = useState(0);
  const [live, setLive] = useState(false); // 进入视口才开始
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [rm, setRm] = useState(false); // prefers-reduced-motion
  const [cmdEcho, setCmdEcho] = useState<string | null>(null); // 点过滤 chips 时底栏闪现 :filter 命令
  const echoTimer = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !startedRef.current) {
          startedRef.current = true;
          setLive(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    // 减弱动态效果偏好：一次性探测，直接呈现完成态，不循环
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const id = window.setTimeout(() => setRm(mq.matches), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!live) return;
    if (rm) {
      const id = window.setTimeout(() => setT(T.summary + 1), 0);
      return () => window.clearTimeout(id);
    }
    if (paused) return; // 暂停：不建 interval，CSS 动画由 .demo-paused 冻结
    const timer = setInterval(() => {
      setT((n) => (n >= T.reset ? 0 : n + 1));
    }, 110);
    return () => clearInterval(timer);
  }, [live, paused, rm]);

  // 新卡片出现时贴底
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [t, filter]);

  // 事件类型过滤：动画时序不变，仅渲染层隐藏不匹配的卡片；
  // 同时在底栏输入区闪现对应 :filter 命令（与真实 TUI 行为呼应）
  const applyFilter = useCallback((k: FilterKey) => {
    setFilter(k);
    if (echoTimer.current) window.clearTimeout(echoTimer.current);
    setCmdEcho(k === "all" ? ":filter" : `:filter ${FILTERS.find((f) => f.k === k)?.label ?? ""}`);
    echoTimer.current = window.setTimeout(() => setCmdEcho(null), 1100);
  }, []);

  // 外部指令入口（⌘K 面板的 :demo / :filter 命令，org:demo-cmd 事件）：
  // 与面板内 chips / 重播按钮同语义，不重复造状态机
  useEffect(() => {
    const onDemoCmd = (e: Event) => {
      const d = (e as CustomEvent<{ filter?: string; replay?: boolean }>).detail ?? {};
      if (d.filter && FILTERS.some((f) => f.k === d.filter)) {
        applyFilter(d.filter as FilterKey);
      }
      if (d.replay) {
        setT(0);
        setPaused(false);
      }
    };
    window.addEventListener("org:demo-cmd", onDemoCmd);
    return () => window.removeEventListener("org:demo-cmd", onDemoCmd);
  }, [applyFilter]);

  useEffect(() => {
    const id = echoTimer.current;
    return () => {
      if (id) window.clearTimeout(id);
    };
  }, []);

  const typed = TASK.slice(0, Math.min(t, T.typed));
  const running = t >= T.sent && t < T.decay;
  const elapsed = ((t - T.sent) * 0.14).toFixed(1);
  const status =
    t < T.sent ? "idle" : t < T.decay ? (paused && !rm ? "paused" : `running ${elapsed}s`) : "idle";
  const currentStep = t < T.factory ? -1 : Math.min(Math.floor((t - T.factory) / T.stepTick), 5);
  // 会话计数随事件增长（细节真实：直连/暖移交各落一个会话）
  const sessionCount = t >= T.handoff ? 5 : t >= T.ask ? 4 : 3;
  // 事件类型过滤：动画时序不变，仅渲染层隐藏不匹配的卡片
  const vis = (k: Exclude<FilterKey, "all">) => filter === "all" || filter === k;

  return (
    <section id="tui" className="scroll-mt-16 border-t border-zinc-800/80">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeading
          kicker="tui · new in v0.4.0"
          title="组织驾驶舱"
          desc="OpenCode 级终端界面：左栏管理会话、专家库与池，主区以事件卡片直播每次派单，底栏输入任务或 : 命令。单二进制内置，org 一敲即达。"
        />

        <p className="sr-only">
          下方为 ORG 终端界面的动画演示：用户输入任务后，系统分解为三个子任务并标注路由方式，
          工厂按规格、生成、检查、验收、登记五步生成专家，审查先返工再通过，汇总后用户直连专家
          问答两轮、再经暖移交把小型请求转给在岗专家，最后三连跑演示模型调用从 5 次衰减到 0 次。
          终端下方为演示控制条（播放/暂停、重播、进度拖拽与事件类型过滤），再下方为路由四路径与
          裁决四态的徽标图例。
        </p>

        <div ref={rootRef} className="mx-auto max-w-4xl">
          <div
            aria-hidden="true"
            className={`tui-scanlines relative overflow-hidden rounded-xl border border-zinc-800 bg-[#0c1210] shadow-2xl shadow-black/50 ${paused ? "demo-paused" : ""}`}
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              </div>
              <p className="font-mono text-xs text-zinc-500">
                ORG — Organization Harness
              </p>
              <p className="font-mono text-xs text-emerald-600">v0.4.1</p>
            </div>

            {/* 主体：左栏 + 主区 */}
            <div className="flex font-mono text-[11.5px] leading-relaxed sm:text-[12px]">
              {/* 左栏（窄终端自动隐藏，与真实 TUI 行为一致） */}
              <div className="hidden w-44 shrink-0 space-y-4 border-r border-zinc-800/80 bg-black/20 p-3.5 md:block">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                    会话 ({sessionCount})
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {RAIL.sessions.map((s) => (
                      <li
                        key={s.label}
                        className={`truncate ${
                          s.active
                            ? `text-emerald-500 ${running ? "animate-pulse" : ""}`
                            : "text-zinc-500"
                        }`}
                      >
                        {s.dot} {s.label}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                    专家库 (3)
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {RAIL.experts.map((e) => (
                      <li key={e} className="truncate text-zinc-500">
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">池</p>
                  <p className="mt-1.5 text-zinc-500">
                    busy <span className={running ? "text-amber-400" : "text-zinc-400"}>1</span>{" "}
                    idle <span className="text-zinc-400">2</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">固化</p>
                  <p className="mt-1.5 text-zinc-500">
                    命中 <span className="text-emerald-500">5</span> 冻结{" "}
                    <span className="text-zinc-400">3</span>
                  </p>
                </div>
              </div>

              {/* 主区：事件流 */}
              <div
                ref={threadRef}
                className="scrollbar-thin h-[340px] flex-1 space-y-3 overflow-y-auto p-4 sm:h-[380px]"
              >
                {t >= T.sent && vis("task") && (
                  <ThreadCard>
                    <span className="mr-2 text-zinc-500">you</span>
                    {TASK}
                  </ThreadCard>
                )}

                {t >= T.decompose && vis("plan") && (
                  <ThreadCard>
                    <p>
                      <span className="mr-2 font-medium text-emerald-500">org</span>
                      任务分解 <span className="text-zinc-600">→</span> 3 子任务
                    </p>
                    {t >= T.task1 && (
                      <p className="pl-4 text-zinc-300">
                        ├ task#1 检索 <Badge k="A">A 内联</Badge>
                      </p>
                    )}
                    {t >= T.task2 && (
                      <p className="pl-4 text-zinc-300">
                        ├ task#2 解析 <Badge k="B">B 复用</Badge>{" "}
                        <span className="text-zinc-500">notice-parser</span>
                      </p>
                    )}
                    {t >= T.task3 && (
                      <p className="pl-4 text-zinc-300">
                        └ task#3 校验 <Badge k="C">C 生成</Badge>
                      </p>
                    )}
                  </ThreadCard>
                )}

                {t >= T.factory && vis("factory") && (
                  <ThreadCard>
                    <p>
                      <span className="text-zinc-500">⚙ 工厂</span>{" "}
                      <span className="text-zinc-200">record-validator@1.0.0</span>
                    </p>
                    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 pl-4">
                      {STEP_LABELS.map((label, i) => {
                        const done = t >= T.stepsDone || i < currentStep;
                        const active = !done && i === currentStep;
                        return (
                          <span key={label} className="flex items-center gap-1.5">
                            {i > 0 && <span className="text-zinc-700">→</span>}
                            <span
                              className={
                                done
                                  ? "text-emerald-500"
                                  : active
                                    ? "animate-pulse text-zinc-100"
                                    : "text-zinc-600"
                              }
                            >
                              {done ? "✓ " : ""}
                              {label}
                            </span>
                          </span>
                        );
                      })}
                    </p>
                  </ThreadCard>
                )}

                {t >= T.revise && vis("review") && (
                  <ThreadCard>
                    <span className="mr-2 text-amber-500">◆ review</span>
                    <span className="text-amber-400">Revise</span>
                    <span className="text-zinc-400">
                      {" "}
                      · 覆盖率 0.80 &lt; 0.95（第1次）
                    </span>
                  </ThreadCard>
                )}

                {t >= T.accept && vis("review") && (
                  <ThreadCard>
                    <span className="mr-2 text-emerald-500">◆ review</span>
                    <span className="text-emerald-400">Accept</span>
                    <span className="text-zinc-400"> · coverage 1.0</span>
                  </ThreadCard>
                )}

                {t >= T.summary && vis("done") && (
                  <ThreadCard>
                    <span className="mr-2 text-emerald-500">✓ 汇总</span>
                    <span className="text-zinc-300">
                      交付物 3 · 资产 2 · model_calls{" "}
                      <span className="font-semibold text-emerald-400">5</span> ·
                      revises 1
                    </span>
                  </ThreadCard>
                )}

                {t >= T.ask && vis("direct") && (
                  <ThreadCard>
                    <p>
                      <span className="mr-2 text-sky-400">⚡ 直连</span>
                      <span className="font-medium text-sky-300">notice-parser</span>
                    </p>
                    <p className="pl-4 text-zinc-400">
                      q 上周抓取任务里的字段映射规则是什么？
                    </p>
                    <p className="pl-4 text-zinc-300">
                      a 标题/日期/部门三字段；日期归一化为 ISO 8601
                    </p>
                    <p className="pl-4 text-zinc-600">
                      2 轮 · 已记账 · 纪要已回写主控
                    </p>
                  </ThreadCard>
                )}

                {t >= T.handoff && vis("direct") && (
                  <ThreadCard>
                    <p>
                      <span className="mr-2 text-zinc-500">⇢ 转接</span>
                      <span className="text-zinc-300">
                        record-validator 小型校验请求
                      </span>
                      <Badge k="D">D 移交</Badge>
                    </p>
                    <p className="pl-4 text-zinc-600">
                      主控移交摘要 → 专家代答 · handoff 通道记账
                    </p>
                  </ThreadCard>
                )}

                {t >= T.decay && vis("done") && (
                  <ThreadCard>
                    <p>
                      <span className="mr-2 text-emerald-500">✓ :demo</span>
                      <span className="text-zinc-300">
                        三连跑 · 成本衰减 model_calls{" "}
                        <span className="font-semibold text-emerald-400">5→1→0</span>
                      </span>
                    </p>
                    <p className="pl-4 text-zinc-600">
                      git 注册表三提交（template → mint → patch）· 资产层增长率账本
                    </p>
                  </ThreadCard>
                )}
              </div>
            </div>

            {/* 底栏：输入 + 状态 */}
            <div className="flex items-center justify-between gap-3 border-t border-zinc-800/80 bg-black/25 px-4 py-2.5 font-mono text-[11.5px] sm:text-[12px]">
              <p className="scrollbar-thin flex min-w-0 flex-1 items-center overflow-x-auto whitespace-nowrap">
                <span className="mr-2 select-none text-emerald-500">›</span>
                {t < T.sent ? (
                  <>
                    <span className="text-zinc-200">{typed}</span>
                    <span
                      className="ml-0.5 inline-block h-3.5 w-2 animate-pulse bg-emerald-500/80"
                    />
                  </>
                ) : cmdEcho ? (
                  <span>
                    <span className="text-zinc-200">{cmdEcho}</span>
                    <span className="ml-0.5 inline-block h-3.5 w-2 animate-pulse bg-emerald-500/80" />
                  </span>
                ) : (
                  <span className="text-zinc-600">输入任务或 :命令…</span>
                )}
              </p>
              <p className="shrink-0 text-zinc-500">
                团队模式 · scripted ·{" "}
                <span
                  className={
                    t >= T.decay
                      ? "text-emerald-500"
                      : running
                        ? "text-amber-400"
                        : "text-zinc-400"
                  }
                >
                  {status}
                </span>
              </p>
            </div>
          </div>

          {/* 演示控制条：播放/暂停/重播 + 进度拖拽 + 事件过滤（对应产品 :filter） */}
          <div className="mx-auto mt-3 max-w-3xl rounded-lg border border-zinc-800/70 bg-zinc-900/30 px-4 py-3">
            <div className="flex items-center gap-3">
              {!rm && (
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaused((p) => !p)}
                    aria-pressed={paused}
                    aria-label={paused ? "播放演示" : "暂停演示"}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-400"
                  >
                    {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setT(0);
                      setPaused(false);
                    }}
                    aria-label="重新播放"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-400"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <input
                type="range"
                min={0}
                max={T.reset}
                value={Math.min(t, T.reset)}
                onChange={(e) => setT(Number(e.target.value))}
                aria-label="演示进度"
                className="h-6 min-w-0 flex-1 cursor-pointer accent-emerald-500"
              />
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-500">
                {String(Math.min(t, T.reset)).padStart(3, "0")}/{T.reset}
              </span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-zinc-800/60 pt-2.5">
              <span className="mr-1 font-mono text-[11px] text-zinc-600">过滤</span>
              {FILTERS.map((f) => {
                const on = filter === f.k;
                return (
                  <button
                    key={f.k}
                    type="button"
                    onClick={() => applyFilter(f.k)}
                    aria-pressed={on}
                    className={`rounded border px-1.5 py-0.5 font-mono text-[11px] transition-colors ${
                      on
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                        : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
              <span className="ml-auto hidden font-mono text-[11px] text-zinc-600 sm:inline">
                {filter === "all" ? "事件流全量" : `仅 ${FILTERS.find((f) => f.k === filter)?.label} 类事件`}
              </span>
            </div>
          </div>

          {/* 徽标图例：路由四路径 + 裁决四态全览（与引擎语义一一对应） */}
          <div className="mx-auto mt-5 max-w-3xl rounded-lg border border-zinc-800/70 bg-zinc-900/30 px-4 py-3">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-[11px]">
              <span className="text-zinc-600">路由</span>
              {(Object.keys(ROUTE_BADGE) as Array<keyof typeof ROUTE_BADGE>).map((k) => (
                <span key={k} className="flex items-center gap-1.5 text-zinc-500">
                  <Badge k={k}>{`${k} ${ROUTE_SEMANTIC[k]}`}</Badge>
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-[11px]">
              <span className="text-zinc-600">裁决</span>
              {(Object.keys(VERDICT_BADGE) as Array<keyof typeof VERDICT_BADGE>).map((k) => (
                <span key={k} className="flex items-center gap-1.5 text-zinc-500">
                  <VBadge v={k} />
                  <span className="text-zinc-600">{VERDICT_SEMANTIC[k]}</span>
                </span>
              ))}
            </div>
          </div>

          <p className="mt-4 text-center font-mono text-[11px] leading-relaxed text-zinc-600">
            三区布局：Tab 切换分区 · j/k 移动 · Enter 选中 · Esc 取消运行 · :demo 三连跑 ·
            窄终端自动收起左栏
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function ThreadCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 space-y-1.5 rounded-md border border-zinc-800/70 bg-white/[0.015] px-3 py-2.5 duration-500">
      {children}
    </div>
  );
}

function Badge({ k, children }: { k: keyof typeof ROUTE_BADGE; children: string }) {
  return (
    <span
      className={`ml-1 inline-block rounded border px-1 py-px align-baseline text-[10px] leading-tight ${ROUTE_BADGE[k]}`}
    >
      [{children}]
    </span>
  );
}

function VBadge({ v }: { v: keyof typeof VERDICT_BADGE }) {
  return (
    <span
      className={`inline-block rounded border px-1 py-px align-baseline text-[10px] leading-tight ${VERDICT_BADGE[v]}`}
    >
      [{v}]
    </span>
  );
}

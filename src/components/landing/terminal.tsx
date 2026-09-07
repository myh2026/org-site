"use client";

import { useEffect, useRef, useState } from "react";
import { CopyButton } from "./copy-button";

// 真实 `org demo` 输出精编（配色标注逐行渲染；打字机逐行揭示）
type Tone = "cmd" | "box" | "phase" | "ok" | "metric" | "git" | "dim" | "end";
interface Line {
  t: Tone;
  s: string;
}

const SCRIPT: Line[] = [
  { t: "cmd", s: "$ bun cli/org.ts demo" },
  { t: "box", s: "╔══════════════════════════════════════════════════╗" },
  { t: "box", s: "║ ORG 全叙事演示：子智能体可生成、可验收、可复用、可演进 ║" },
  { t: "box", s: "╚══════════════════════════════════════════════════╝" },
  { t: "phase", s: "── run A · 现场铸专家（工厂闸门）+ 过程审查（返工）──────────" },
  { t: "ok", s: "  ✓ 工厂五步闸门：dhv check → fixture 验收 → 入库（git 提交）" },
  { t: "phase", s: "── run B · 复用资产（零工厂）+ 意见复发 → 补丁合入 → 金丝雀 ──" },
  { t: "ok", s: "  ✓ 固化命中 4 次（零模型调用）· shadow_compare agree=true" },
  { t: "ok", s: "  ✓ canary_confirmed · patch record-validator -> 1.0.1" },
  { t: "phase", s: "── run C · 蓝绿验证（补丁版 v1.0.1 上岗）+ 零返工 ──────────" },
  { t: "ok", s: "  ✓ 判定节点 5/5 全命中 · 零模型调用 · 零返工" },
  { t: "phase", s: "── D 直连 · 多轮会话（记账 + 会话账本 + 纪要回写）──────────" },
  { t: "phase", s: "── E 转接 · 暖移交（主控移交摘要 → 专家代答）──────────────" },
  { t: "dim", s: "  ── 走读摘要 ──────────────────────────────────────────" },
  { t: "metric", s: "  A ok=true  5 model_calls · 1 revises · 3 资产 · 冻结 2 条判定映射" },
  { t: "metric", s: "  B ok=true  1 model_calls · 1 revises · 固化命中 4 次" },
  { t: "metric", s: "  C ok=true  0 model_calls · 0 revises · 固化命中 5 次" },
  { t: "git", s: "  git 注册表（资产层增长率账本）：" },
  { t: "git", s: "    312f648 patch record-validator -> 1.0.1" },
  { t: "git", s: "    b54f509 mint record-validator@1.0.0 (factory)" },
  { t: "git", s: "    9696941 registry template (notice-parser@1.0.0)" },
  { t: "end", s: "  总耗时 2.1s · 产物 out-{a,b,c,direct,handoff} · dist/demo 已导出" },
  { t: "ok", s: "  下一步：$ org → 打开组织驾驶舱（v0.4.1 内置 TUI）" },
];

const TONE_CLASS: Record<Tone, string> = {
  cmd: "text-zinc-100",
  box: "text-emerald-600/80",
  phase: "text-zinc-500",
  ok: "text-emerald-500",
  metric: "text-zinc-300",
  git: "text-amber-500/90",
  dim: "text-zinc-600",
  end: "text-zinc-400",
};

export function Terminal() {
  const [shown, setShown] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const cleanup = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (started.current) return;
    // 减弱动态效果偏好：不逐行打字，直接呈现完整输出（与 tui-showcase 的 rm 语义一致）
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      started.current = true;
      const id = window.setTimeout(() => setShown(SCRIPT.length), 0);
      return () => window.clearTimeout(id);
    }
    // 观察到终端进入视口才开始播放（首屏即见则立即播；未滚到不空转）
    const el = bodyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || started.current) return;
        started.current = true;
        io.disconnect();
        const timer = setInterval(() => {
          setShown((n) => {
            if (n >= SCRIPT.length) {
              clearInterval(timer);
              return n;
            }
            return n + 1;
          });
        }, 170);
        // 播完即清：interval 存进闭包，停止后由本清理函数接管
        cleanup.current = () => clearInterval(timer);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cleanup.current?.();
    };
  }, []);

  useEffect(() => {
    // 新行出现时贴底滚动
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [shown]);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50">
      {/* 标题栏 */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-4 py-2.5">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        </div>
        <p className="font-mono text-xs text-zinc-500">org demo · scripted 模式 · 确定性重演</p>
        <CopyButton text={"bun cli/org.ts demo"} />
      </div>
      {/* 终端主体 */}
      <div
        ref={bodyRef}
        className="scrollbar-thin h-[380px] overflow-y-auto p-4 font-mono text-[12px] leading-[1.75] sm:text-[12.5px]"
        aria-label="org demo 终端输出演示"
      >
        {SCRIPT.slice(0, shown).map((line, i) => (
          <pre
            key={i}
            className={`whitespace-pre-wrap break-all ${TONE_CLASS[line.t]}`}
          >
            {line.s}
          </pre>
        ))}
        {shown < SCRIPT.length ? (
          <span className="inline-block h-4 w-2 animate-pulse bg-emerald-500/80 align-middle" aria-hidden="true" />
        ) : (
          <p className="text-zinc-600">$ <span className="inline-block h-3.5 w-2 animate-pulse bg-zinc-500 align-middle" aria-hidden="true" /></p>
        )}
      </div>
    </div>
  );
}

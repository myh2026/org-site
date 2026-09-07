"use client";

import { useState } from "react";
import { SectionHeading } from "./section-heading";

// ---------------------------------------------------------------------------
// 六大部件：交互式组织拓扑图 + 部件卡
// 上半：SVG 拓扑（用户 → 主控/直连 → 路由器 → 专家库/工厂/池），
//       连线为流动虚线；hover/点选部件时高亮其上下游，其余退为背景。
// 下半：六张部件卡，与拓扑图双向联动（hover 卡片 = hover 图中节点）。
// ---------------------------------------------------------------------------

type NodeId = "you" | "master" | "router" | "registry" | "factory" | "pool" | "direct";

interface Part {
  nodeId: NodeId;
  name: string;
  role: string;
  mech: string;
  file: string;
}

const PARTS: Part[] = [
  {
    nodeId: "master",
    name: "主控",
    role: "分解、路由、审查、汇总",
    mech: "全系统唯一手写内核；监督回路四阶段事件拓扑；批量澄清早发；任务契约先行",
    file: "hsl/org.hsl",
  },
  {
    nodeId: "router",
    name: "路由器",
    role: "每个子任务四选一",
    mech: "A 内联 / B 复用 / C 现场生成 / D 暖移交；纯函数判定，路由是制度不是模型",
    file: "hsl/router/policy.hsl",
  },
  {
    nodeId: "registry",
    name: "专家库",
    role: "磁盘资产层，不占运行时",
    mech: "git 仓库作注册表；manifest 六字段；能力交集 + 语义粗排检索",
    file: "hsl/registry/manifest.hsl",
  },
  {
    nodeId: "factory",
    name: "专家工厂",
    role: "新品生成 + 补丁合入，同一闸门",
    mech: "规格提取 → HSL 生成 → dhv check → fixture 验收 → 入库登记（真实子进程）",
    file: "hsl/factory/pipeline.hsl",
  },
  {
    nodeId: "pool",
    name: "智能体池",
    role: "运行中的有状态实例",
    mech: "生命周期状态机；双执行车道（进程内 / 嵌套解释器 = 蓝绿发布）",
    file: "hsl/pool/lifecycle.hsl",
  },
  {
    nodeId: "direct",
    name: "直连前台",
    role: "用户可寻址池内专家",
    mech: "多轮会话 + 暖移交；调度权可绕，知情权与记账权不可绕",
    file: "hsl/pool/direct.hsl",
  },
];

const PART_BY_NODE = new Map(PARTS.map((p) => [p.nodeId, p]));

// SVG 拓扑几何（viewBox 800 × 400；节点按中心点定位）
interface NodeGeo {
  id: NodeId;
  x: number;
  y: number;
  w: number;
  h: number;
}

const NODES: NodeGeo[] = [
  { id: "you", x: 400, y: 46, w: 132, h: 42 },
  { id: "direct", x: 140, y: 178, w: 160, h: 54 },
  { id: "master", x: 400, y: 178, w: 176, h: 62 },
  { id: "router", x: 660, y: 178, w: 160, h: 54 },
  { id: "pool", x: 140, y: 322, w: 160, h: 54 },
  { id: "factory", x: 400, y: 322, w: 176, h: 62 },
  { id: "registry", x: 660, y: 322, w: 160, h: 54 },
];

const NODE_GEO = new Map(NODES.map((n) => [n.id, n]));

// 边：单向数据流（布局已排线避免交叉；label 为中点附近的可读位置）
interface Edge {
  from: NodeId;
  to: NodeId;
  label: string;
  lx: number;
  ly: number;
  anchor?: "start";
}

const EDGES: Edge[] = [
  { from: "you", to: "master", label: "派单 · TaskSpec", lx: 410, ly: 110, anchor: "start" },
  { from: "you", to: "direct", label: "直连 · ask", lx: 248, ly: 98 },
  { from: "master", to: "router", label: "路由判定", lx: 530, ly: 168 },
  { from: "router", to: "registry", label: "B 复用检索", lx: 672, ly: 250, anchor: "start" },
  { from: "router", to: "factory", label: "C 现场生成", lx: 552, ly: 244 },
  { from: "router", to: "pool", label: "A 内联派单", lx: 330, ly: 262 },
  { from: "factory", to: "registry", label: "登记入库", lx: 530, ly: 314 },
  { from: "pool", to: "master", label: "Report 回报", lx: 262, ly: 256 },
  { from: "direct", to: "pool", label: "寻址实例", lx: 152, ly: 250, anchor: "start" },
];

// 色板（SVG 内不能用 Tailwind class，取自暗色主题实际色值）
const C = {
  edgeIdle: "#3f3f46", // zinc-700
  edgeHot: "#10b981", // emerald-500
  labelIdle: "#71717a", // zinc-500
  labelHot: "#34d399", // emerald-400
  boxFill: "#0a0f0d",
  boxStroke: "#3f3f46",
  boxHot: "#10b981",
  textMain: "#e4e4e7", // zinc-200
  textSub: "#71717a",
};

const YOU_HINT =
  "任务发起者。TaskSpec 信封进主控，Report 信封回收；也可以绕过派单，经直连前台直接问答在岗专家。";

export function Architecture() {
  const [active, setActive] = useState<NodeId | null>(null);

  // 邻接判断：边与节点是否属于当前高亮集合
  const edgeActive = (e: Edge) => active !== null && (e.from === active || e.to === active);
  const nodeActive = (id: NodeId) => active === id;
  const dim = active !== null;

  const activePart = active !== null ? PART_BY_NODE.get(active) : undefined;
  const descRole =
    active === "you" ? "任务发起者" : activePart ? activePart.role : "";
  const descMech =
    active === "you"
      ? YOU_HINT
      : activePart
        ? activePart.mech
        : "将光标移到（触屏：点按）图中的部件或下方卡片上，查看它的职责与上下游数据流。";
  const descFile = active === "you" ? "" : activePart ? activePart.file : "";

  return (
    <section id="architecture" className="scroll-mt-16 border-t border-zinc-800/80 bg-zinc-950/50">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeading
          kicker="architecture"
          title="六大部件"
          desc="主控与专家之间只对齐类型化接口（信封契约：TaskSpec -> Result<Report, ExpertError>），payload 按领域自定义——全强类型互相卡死，全自由文本退化为黑盒，信封是平衡点。"
        />

        <div onMouseLeave={() => setActive(null)}>
          {/* 拓扑图 + 上下游说明（同一外壳统一圆角） */}
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
            <div className="overflow-x-auto">
              <svg
                viewBox="0 0 800 400"
                role="img"
                aria-label="ORG 组织拓扑图：用户经主控派单，路由器在专家库、专家工厂与智能体池之间做四路判定，直连前台提供用户到池内专家的寻址通道"
                className="h-auto w-full min-w-[640px]"
              >
              <defs>
                <marker
                  id="arch-arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="context-stroke" />
                </marker>
              </defs>

              {/* 连线层（先画线，节点不透明填充遮住端头） */}
              {EDGES.map((e) => {
                const f = NODE_GEO.get(e.from);
                const t = NODE_GEO.get(e.to);
                if (!f || !t) return null;
                const hot = edgeActive(e);
                return (
                  <g key={`${e.from}-${e.to}`} opacity={dim && !hot ? 0.14 : 1} className="transition-opacity duration-300">
                    <line
                      x1={f.x}
                      y1={f.y}
                      x2={t.x}
                      y2={t.y}
                      stroke={hot ? C.edgeHot : C.edgeIdle}
                      strokeWidth={hot ? 1.8 : 1.2}
                      markerEnd="url(#arch-arrow)"
                      className={`arch-edge ${hot ? "arch-edge-hot" : ""}`}
                    />
                    <text
                      x={e.lx}
                      y={e.ly}
                      textAnchor={e.anchor ?? "middle"}
                      fontSize={11}
                      fontFamily="var(--font-geist-mono), ui-monospace, monospace"
                      fill={hot ? C.labelHot : C.labelIdle}
                      stroke="#09090b"
                      strokeWidth={3.5}
                      paintOrder="stroke"
                    >
                      {e.label}
                    </text>
                  </g>
                );
              })}

              {/* 节点层 */}
              {NODES.map((n) => {
                const hot = nodeActive(n.id);
                const isYou = n.id === "you";
                const isCore = n.id === "master";
                const label = isYou ? "你 · you" : PART_BY_NODE.get(n.id)?.name ?? "";
                const sub = isYou ? "workspace" : PART_BY_NODE.get(n.id)?.file ?? "";
                const dimmed = dim && !hot;
                return (
                  <g
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${label}：${isYou ? YOU_HINT : PART_BY_NODE.get(n.id)?.role}`}
                    onMouseEnter={() => setActive(n.id)}
                    onFocus={() => setActive(n.id)}
                    onClick={() => setActive(n.id)}
                    className="cursor-pointer outline-none"
                    opacity={dimmed ? 0.38 : 1}
                    style={{ transition: "opacity 300ms" }}
                  >
                    <rect
                      x={n.x - n.w / 2}
                      y={n.y - n.h / 2}
                      width={n.w}
                      height={n.h}
                      rx={10}
                      fill={C.boxFill}
                      stroke={
                        hot ? C.boxHot : isCore ? "rgba(16,185,129,0.55)" : C.boxStroke
                      }
                      strokeWidth={hot ? 1.8 : isCore ? 1.4 : 1.1}
                      strokeDasharray={isYou ? "4 3" : undefined}
                    />
                    <text
                      x={n.x}
                      y={sub ? n.y - 4 : n.y + 4.5}
                      textAnchor="middle"
                      fontSize={isCore ? 14 : 13}
                      fontWeight={600}
                      fontFamily="var(--font-geist-mono), ui-monospace, monospace"
                      fill={hot ? "#6ee7b7" : C.textMain}
                    >
                      {label}
                    </text>
                    {sub && (
                      <text
                        x={n.x}
                        y={n.y + 14}
                        textAnchor="middle"
                        fontSize={9.5}
                        fontFamily="var(--font-geist-mono), ui-monospace, monospace"
                        fill={C.textSub}
                      >
                        {sub}
                      </text>
                    )}
                  </g>
                );
              })}
              </svg>
            </div>

            {/* 上下游说明栏 */}
            <div
              aria-live="polite"
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-zinc-800 bg-zinc-900/40 px-4 py-3 font-mono text-[12px] md:px-5"
            >
              {descRole ? (
                <>
                  <span className="font-semibold text-emerald-400">{descRole}</span>
                  <span className="min-w-0 flex-1 text-zinc-400">{descMech}</span>
                  {descFile && (
                    <span className="shrink-0 text-[11px] text-zinc-600">{descFile}</span>
                  )}
                </>
              ) : (
                <span className="min-w-0 flex-1 text-zinc-500">{descMech}</span>
              )}
              <span className="shrink-0 text-[11px] text-zinc-600 md:hidden">
                ⇄ 拓扑图可左右滑动
              </span>
            </div>
          </div>

          {/* 部件卡（与拓扑图联动） */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PARTS.map((p, i) => {
              const hot = active === p.nodeId;
              return (
                <article
                  key={p.name}
                  onMouseEnter={() => setActive(p.nodeId)}
                  onFocus={() => setActive(p.nodeId)}
                  tabIndex={0}
                  aria-label={`${p.name}：${p.role}`}
                  className={`group flex cursor-default flex-col rounded-xl border bg-card p-6 outline-none transition-colors ${
                    hot
                      ? "border-emerald-500/50 bg-emerald-500/[0.04]"
                      : "border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-mono text-base font-semibold text-zinc-100">{p.name}</h3>
                    <span
                      className={`font-mono text-[10px] transition-colors ${
                        hot ? "text-emerald-500" : "text-zinc-600 group-hover:text-emerald-600"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300">{p.role}</p>
                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-zinc-500">{p.mech}</p>
                  <p className="mt-4 font-mono text-[11px] text-zinc-600">{p.file}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

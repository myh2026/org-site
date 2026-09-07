// ---------------------------------------------------------------------------
// 版本历史时间线：真实发版记录（GitHub Releases v0.3.0 / v0.4.0 / v0.4.1）+
// 早期内部里程碑（v0.1.0 / v0.2.0，随 org-harness 演进线并入）。
// 数据口径与仓库 CHANGELOG.md 一致；链接指向真实 Release 页。
// ---------------------------------------------------------------------------

import { Tag, ArrowUpRight, Package, FlaskConical } from "lucide-react";
import { SectionHeading } from "./section-heading";

interface ReleaseNode {
  version: string;
  date: string;
  title: string;
  bullets: string[];
  released: boolean;
  assets?: number;
  url?: string;
}

const RELEASES: ReleaseNode[] = [
  {
    version: "v0.4.1",
    date: "2026-09-07",
    title: "TUI 事件流过滤 :filter + 官方 sha256 校验和",
    bullets: [
      ":filter 任务|分解|工厂|裁决|直连|汇总|动态——视图偏好，不随 run 重置，状态栏徽标可观测",
      "--print 支持视图类命令：org tui --print --demo \":filter 裁决\" 一帧出图",
      "发布资产全部附带 .sha256 旁车（二进制 + 源码包 + dist + 汇总 txt），可离线验证完整性",
    ],
    released: true,
    assets: 15,
    url: "https://github.com/myh2026/org/releases/tag/v0.4.1",
  },
  {
    version: "v0.4.0",
    date: "2026-09-06",
    title: "产品化：组织驾驶舱 TUI + 三平台单二进制",
    bullets: [
      "OpenCode 级终端前端：三区布局 · 八类事件卡片 · 四态裁决徽标 · 三主题 · 零依赖渲染器",
      "Windows / macOS（Intel+Apple）/ Linux（x64+arm64）五目标交叉编译，运行时资源内嵌",
      "无 bun 环境全功能：cliMain 可编程入口 + $host.dhv 进程内兜底 + 工厂闸门双车道",
    ],
    released: true,
    assets: 7,
    url: "https://github.com/myh2026/org/releases/tag/v0.4.0",
  },
  {
    version: "v0.3.0",
    date: "2026-09-06",
    title: "运行时动力学收官 + 69 个机制级测试",
    bullets: [
      "影子晋升（金丝雀双跑）· 静默更新检测 · N 版本冗余",
      "三档补丁闸门（知识 / 流程 / 能力变更）· 多轮直连 · 暖移交通道",
      "评分卡 evidence 跨运行累计账本 · 固化自动降级语义收紧",
    ],
    released: true,
    assets: 2,
    url: "https://github.com/myh2026/org/releases/tag/v0.3.0",
  },
  {
    version: "v0.2.0",
    date: "2026-09-06",
    title: "工程化：源码 / 产物 / 流水线三分布局",
    bullets: [
      "hsl/ 源码单列 · dist/ 编译产物入库（与源码同库演进）",
      "CI 三连跑冒烟 + 产物自动回写（[skip ci] 防循环）",
      "工具链 vendored 入库：克隆即跑，零环境依赖",
    ],
    released: false,
  },
  {
    version: "v0.1.0",
    date: "2026-09-06",
    title: "MVP 闭环：子智能体成为工程资产",
    bullets: [
      "信封契约 + 工厂五步闸门（真实 dhv check + fixture 验收，闸门是真的）",
      "监督回路四态裁决 · 路由四路径 · 池化轻档 · 直连记账",
      "固化管线（精确匹配档）实测 model_calls 5→1→0 · 评分卡证据归因",
    ],
    released: false,
  },
];

export function ChangelogSection() {
  return (
    <section id="changelog" className="scroll-mt-16 border-t border-zinc-800/80">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeading
          kicker="changelog"
          title="版本历史"
          desc="从「一个任务被现场生成、验收、使用并沉淀」的最小闭环，到可下载的单二进制驾驶舱——每一步都保持可复现（CI 全绿才发版）。"
        />

        <div className="relative mx-auto max-w-3xl">
          {/* 时间线竖线 */}
          <div
            aria-hidden="true"
            className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-emerald-500/60 via-zinc-700/60 to-transparent"
          />

          <ol className="space-y-10">
            {RELEASES.map((r, i) => (
              <li key={r.version} className="relative pl-10">
                {/* 节点圆点 */}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-1.5 flex h-[15px] w-[15px] items-center justify-center rounded-full border ${
                    r.released
                      ? "border-emerald-500 bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                      : "border-zinc-600 bg-zinc-900"
                  }`}
                >
                  {r.released && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                </span>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <h3 className="font-mono text-lg font-semibold tracking-tight text-zinc-100">
                    {r.version}
                  </h3>
                  {r.released ? (
                    <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400">
                      <Tag className="h-3 w-3" aria-hidden="true" />
                      已发版
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800/50 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
                      <FlaskConical className="h-3 w-3" aria-hidden="true" />
                      内部里程碑
                    </span>
                  )}
                  {typeof r.assets === "number" && (
                    <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-500">
                      <Package className="h-3 w-3" aria-hidden="true" />
                      {r.assets} 资产
                    </span>
                  )}
                  <time className="font-mono text-[11px] text-zinc-600">{r.date}</time>
                </div>

                <p className="mt-2 text-[15px] font-medium text-zinc-200">{r.title}</p>
                <ul className="mt-2 space-y-1.5">
                  {r.bullets.map((b) => (
                    <li key={b} className="flex gap-2 text-sm leading-relaxed text-zinc-400">
                      <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                      {b}
                    </li>
                  ))}
                </ul>

                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-3 inline-flex items-center gap-1 font-mono text-xs text-emerald-500 transition-colors hover:text-emerald-400"
                  >
                    查看 Release
                    <ArrowUpRight
                      className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </a>
                )}

                {/* 首节点轻微强调（当前版本） */}
                {i === 0 && (
                  <span className="sr-only">（当前最新版本）</span>
                )}
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-12 text-center font-mono text-[11px] text-zinc-600">
          每次发版前置校验：dhv check 全量模块 · 69 机制级测试 · TUI 离屏冒烟 · 全叙事三连跑
        </p>
      </div>
    </section>
  );
}

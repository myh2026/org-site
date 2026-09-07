import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Terminal } from "./terminal";
import { CopyButton } from "./copy-button";
import { RepoBadges } from "./repo-badges";
import { OrgHealth } from "./org-health";

const INSTALL_CMD = "git clone https://github.com/myh2026/org.git && cd org && bun cli/org.ts demo";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* 蓝图网格背景（渐隐） */}
      <div className="bg-grid mask-fade-b pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-28 md:px-6 md:pb-24 md:pt-36">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
          {/* 左：定位 */}
          <div className="min-w-0">
            <p className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 font-mono text-[11px] text-zinc-400">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
              <span className="truncate">
                v0.4.1 · TUI 驾驶舱 + 三平台单二进制
                <span className="hidden sm:inline"> · 基于 HSL BNF v1.5.0</span>
              </span>
            </p>
            <h1 className="font-mono text-4xl font-semibold leading-[1.15] tracking-tight text-zinc-50 md:text-5xl">
              子智能体是
              <br />
              <span className="text-emerald-500">工程资产</span>，
              <br />
              不是一次性函数。
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-zinc-400">
              ORG 是一个基于 HSL 的组织化多智能体系统：专家用可校验的拓扑描述，
              生成必须过结构闸门与行为验收，任务结束沉淀回库——
              成熟流程的单位成本随使用递减（实测模型调用 5 → 1 → 0）。
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                className="h-10 bg-emerald-600 px-5 font-mono text-sm text-zinc-950 hover:bg-emerald-500"
              >
                <a href="#download">
                  下载 v0.4.1
                  <ArrowDown className="ml-1 h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 border-zinc-800 bg-transparent px-5 font-mono text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
              >
                <a href="#quickstart">快速开始</a>
              </Button>
            </div>

            {/* 安装命令 */}
            <div className="mt-8 flex max-w-lg items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/80 py-2.5 pl-4 pr-2.5">
              <code className="scrollbar-thin min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[12px] text-zinc-400">
                <span className="select-none text-emerald-600">$ </span>
                git clone github.com/myh2026/org && cd org && bun cli/org.ts demo
              </code>
              <CopyButton text={INSTALL_CMD} />
            </div>

            {/* GitHub 实时统计（拉取失败自动隐藏） */}
            <RepoBadges />

            {/* 工程体检条：实测元数据（版本/commit/模块数/内核行数，全部可点击溯源） */}
            <OrgHealth />
          </div>

          {/* 右：真实终端 */}
          <div className="min-w-0">
            <Terminal />
          </div>
        </div>
      </div>
    </section>
  );
}

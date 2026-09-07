"use client";

import { CopyButton } from "./copy-button";
import { SectionHeading } from "./section-heading";

interface Step {
  n: string;
  title: string;
  desc: string;
  cmd: string;
  out?: string;
}

// 命令行以 $ 提示符渲染；# 开头视为注释（弱化显示）
const CMD_RE = /^(bun|git|curl|wget|unzip|install|org|sudo|mv)\b/;

const LATEST = "https://github.com/myh2026/org/releases/latest/download";

const STEPS: Step[] = [
  {
    n: "01",
    title: "安装二进制，启动 TUI",
    desc: "v0.4.0 起提供 Windows / macOS / Linux 单文件可执行，零运行时依赖。下载解压 → 放入 PATH → 输入 org 进入组织驾驶舱；也可直接点「下载与安装」区的平台卡。",
    cmd: `# 以 Linux x64 为例（macOS / Windows 见下载区平台卡）
curl -fLO ${LATEST}/org-linux-x64.zip
unzip org-linux-x64.zip && sudo mv org /usr/local/bin/
org`,
    out: "TUI 三区布局：会话 / 专家库 / 池 · 主区事件流 · 底栏输入与状态",
  },
  {
    n: "02",
    title: "源码方式：克隆即跑",
    desc: "解释器（dhv-ts）已 vendored 入库，只需要 bun（≥1.1），无任何环境准备。",
    cmd: "git clone https://github.com/myh2026/org.git\ncd org\nbun cli/org.ts demo",
    out: "总耗时 2.1s · 产物 out-{a,b,c,direct,handoff} · dist/demo 已导出",
  },
  {
    n: "03",
    title: "跑一次机制级测试",
    desc: "69 个测试逐条验证 README 的承诺：结构闸门、工厂衰减曲线、补丁与金丝雀、固化持久化、动力学点火。",
    cmd: "bun test tests/",
    out: "69 pass · 0 fail · 156 expect() calls",
  },
  {
    n: "04",
    title: "派单 / 直连 / 暖移交",
    desc: "团队模式派单走完整监督回路；org ask 多轮直连（记账 + 会话账本）；org handoff 转接专家代答。",
    cmd:
      'bun cli/org.ts run --task "抓取某站点近一周公告，输出结构化表格"\nbun cli/org.ts ask notice-parser --session demo --turns "那日期无法解析时怎么处理？|再总结一下字段规则"\nbun cli/org.ts handoff notice-parser --task "把解析规则整理成一句话"',
  },
];

export function Quickstart() {
  return (
    <section id="quickstart" className="scroll-mt-16 border-t border-zinc-800/80">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeading
          kicker="quickstart"
          title="快速开始"
          desc="二进制三步进驾驶舱；scripted 模式确定性重演（无需 API Key）；真实模型用 --model deepseek 经 $host.llm 网关。"
        />
        <div className="space-y-6">
          {STEPS.map((s) => (
            <article
              key={s.n}
              className="grid gap-5 rounded-xl border border-zinc-800 bg-card p-6 md:grid-cols-[1fr_1.4fr] md:p-7"
            >
              <div className="min-w-0">
                <p className="font-mono text-[11px] tracking-widest text-emerald-600">{s.n}</p>
                <h3 className="mt-2 font-mono text-base font-semibold text-zinc-100">{s.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">{s.desc}</p>
                {s.out ? (
                  <p className="mt-3 inline-block rounded border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[11px] text-emerald-600">
                    → {s.out}
                  </p>
                ) : null}
              </div>
              <div className="relative min-w-0 rounded-lg border border-zinc-800 bg-zinc-950">
                <div className="scrollbar-thin overflow-x-auto p-4">
                  <pre className="font-mono text-[12px] leading-relaxed">
                    {s.cmd.split("\n").map((line, i) => {
                      if (line.startsWith("#")) {
                        return (
                          <span key={i} className="block whitespace-pre text-zinc-600">
                            {line}
                          </span>
                        );
                      }
                      if (CMD_RE.test(line)) {
                        return (
                          <span key={i} className="block whitespace-pre text-zinc-300">
                            <span className="select-none text-emerald-600">$ </span>
                            {line}
                          </span>
                        );
                      }
                      return (
                        <span key={i} className="block whitespace-pre text-zinc-300">
                          {line}
                        </span>
                      );
                    })}
                  </pre>
                </div>
                <CopyButton text={s.cmd} className="absolute right-2.5 top-2.5" />
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 font-mono text-[11.5px] text-zinc-600">
          环境变量：ORG_CAPABILITY_APPROVED=1 批准能力变更补丁（仅用户）· ORG_REDUNDANCY=2 启用 N 版本冗余 · DHV_TS 覆盖内嵌工具链
        </p>
      </div>
    </section>
  );
}

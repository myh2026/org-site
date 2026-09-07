import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SectionHeading } from "./section-heading";
import { SourceViewer, type SourceFile } from "./source-viewer";

// ---------------------------------------------------------------------------
// 主控源码区：设计铁律说「主控是唯一手写内核」——这一节把内核本身摆出来。
// 服务端实时读取本机 ORG 产品仓库工作树（/home/z/org，v0.4.1 · main），
// 无删节、无手写示例；仓库缺席时整节降级为提示（不阻塞页面）。
// ---------------------------------------------------------------------------

const ORG_HOME = process.env.ORG_REPO_HOME ?? "/home/z/org";
const GITHUB_BLOB = "https://github.com/myh2026/org/blob/main/hsl";

const FILES: Array<{ rel: string; label: string; desc: string }> = [
  {
    rel: "org.hsl",
    label: "org.hsl",
    desc: "主控内核 · 监督回路 graph + main 入口（全系统唯一手写组件）",
  },
  {
    rel: "contracts/contract.hsl",
    label: "contract.hsl",
    desc: "信封契约 · TaskSpec→Result<Report,ExpertError> · 监督四态裁决",
  },
  {
    rel: "router/policy.hsl",
    label: "policy.hsl",
    desc: "路由策略 · A 内联 / B 复用 / C 生成 / D 暖移交 的判定依据",
  },
  {
    rel: "policy/capability.hsl",
    label: "capability.hsl",
    desc: "capability 三态 auto/confirm/deny · 调度权可绕，知情与记账不可绕",
  },
  {
    rel: "factory/pipeline.hsl",
    label: "pipeline.hsl",
    desc: "专家工厂 · 规格→生成→check→验收→登记 五步闸门管线",
  },
];

function readSource(rel: string): string {
  try {
    return readFileSync(join(ORG_HOME, "hsl", rel), "utf8");
  } catch {
    return "";
  }
}

export function SourceSection() {
  const files: SourceFile[] = FILES.map((f) => ({
    ...f,
    code: readSource(f.rel),
    url: `${GITHUB_BLOB}/${f.rel}`,
  }));
  const hasSource = files.some((f) => f.code.length > 0);

  return (
    <section id="source" className="scroll-mt-16 border-t border-zinc-800/80">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeading
          kicker="source · the kernel"
          title="主控源码"
          desc="「主控是唯一手写内核」不是修辞——下面就是它。服务端实时读取 org 工作树中的真实 HSL 源码，无删节：监督回路四阶段、路由四路径、四态裁决与 capability 三态全部定义在这份 HSL 图里，由 dhv check（S1–S8 / G1–G6 / P 铁律）静态把关，其余部件由工厂按同规格生成。"
        />

        {hasSource ? (
          <SourceViewer files={files} />
        ) : (
          <p className="rounded-xl border border-zinc-800 bg-card px-5 py-6 text-center font-mono text-[13px] text-zinc-500">
            源码未随部署携带——克隆{" "}
            <a
              href="https://github.com/myh2026/org"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 underline decoration-emerald-500/40 underline-offset-4 hover:text-emerald-300"
            >
              github.com/myh2026/org
            </a>{" "}
            后查看 hsl/ 目录即可读到相同内容。
          </p>
        )}

        <p className="mt-4 text-center font-mono text-[11px] leading-relaxed text-zinc-600">
          实时读取自 org 工作树（main · v0.4.1）· 高亮为装饰，真实把关者是 dhv check ·
          org check 30/30 · 69 机制级测试全绿
        </p>
      </div>
    </section>
  );
}

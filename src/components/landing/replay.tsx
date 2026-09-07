import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SectionHeading } from "./section-heading";
import { ReplayViewer } from "./replay-viewer";

// ---------------------------------------------------------------------------
// 真实运行产物：v0.4.0 发布包内 dist/demo/out-a 快照（org demo 三连跑之一）。
// 服务端读 public/demo/ 下快照文件，客户端 tab 查看——页面上的每一行都是
// 产品真实输出，非手写演示数据。
// ---------------------------------------------------------------------------

function readDemo(name: string): string {
  try {
    return readFileSync(join(process.cwd(), "public", "demo", name), "utf8");
  } catch {
    return "";
  }
}

export function ReplaySection() {
  const runRaw = readDemo("out-a-run.json");
  const journal = readDemo("out-a-journal.jsonl");
  const events = readDemo("out-a-events.jsonl");
  const report = readDemo("out-a-report.md");
  const scorecard = readDemo("out-a-scorecard.json");

  let run: { ok?: boolean; elapsed_ms?: number; events?: number; model?: string; task?: string } =
    {};
  try {
    run = JSON.parse(runRaw);
  } catch {
    // 快照缺失时区块降级为提示（不阻塞页面）
  }

  const hasData = Boolean(journal && report);

  return (
    <section id="replay" className="scroll-mt-16 border-t border-zinc-800/80">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeading
          kicker="replay · real artifacts"
          title="真实运行产物"
          desc="下面不是示意图——是 v0.4.0 发布包内 org demo 一次完整运行的快照（dist/demo/out-a）：任务分解、路由判定、审查裁决、交付报告与评分卡，全部由引擎真实写出。org replay 可逐事件重演这条时间线。"
        />

        {hasData ? (
          <ReplayViewer
            journal={journal}
            events={events}
            report={report}
            scorecard={scorecard}
            meta={{
              task: run.task ?? "",
              model: run.model ?? "—",
              elapsed: run.elapsed_ms ?? 0,
              events: run.events ?? 0,
            }}
          />
        ) : (
          <p className="rounded-xl border border-zinc-800 bg-card px-5 py-6 text-center font-mono text-[13px] text-zinc-500">
            快照未随部署携带——克隆仓库后执行 <code className="text-zinc-300">org demo</code>{" "}
            即可再生相同产物。
          </p>
        )}

        <p className="mt-4 text-center font-mono text-[11px] leading-relaxed text-zinc-600">
          产物快照随仓库发布（dist/demo/）· org replay --run dist/demo/out-a 逐事件重演 ·
          events.jsonl 为 55 事件全集（append-only 溯源日志）· journal→fixture 基准题 4 条（生产即出题）
        </p>
      </div>
    </section>
  );
}

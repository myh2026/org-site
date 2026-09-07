import { SectionHeading } from "./section-heading";

// ----------------------------------------------------------------------------
// 数字带
// ----------------------------------------------------------------------------

const STATS = [
  { v: "69", u: "个机制级测试", d: "bun test 全绿" },
  { v: "5→1→0", u: "模型调用衰减", d: "固化改变成本结构" },
  { v: "~2s", u: "全叙事演示", d: "org demo 三连跑" },
  { v: "3", u: "平台单二进制", d: "Windows · macOS · Linux" },
];

export function Stats() {
  return (
    <section className="border-y border-zinc-800/80 bg-zinc-950">
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-zinc-800/80 px-4 md:grid-cols-4 md:divide-x md:px-6">
        {STATS.map((s) => (
          <div key={s.u} className="px-2 py-8 md:px-8">
            <p className="font-mono text-3xl font-semibold tracking-tight text-emerald-500 md:text-4xl">
              {s.v}
            </p>
            <p className="mt-2 text-sm text-zinc-300">{s.u}</p>
            <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// 为什么是 ORG（对比表）
// ----------------------------------------------------------------------------

const COMPARISON: Array<[string, string, string]> = [
  ["子智能体本质", "通用循环 + 提示词 + 工具白名单", "HSL graph：流程即拓扑，编译期校验"],
  ["生成物验收", "无，运行时才发现问题", "dhv check + fixture 验收，不过不上岗"],
  ["过程审查", "结果导向，事后发现", "契约对照，四态裁决，返工有界"],
  ["任务结束", "产出交付，执行体销毁", "专家 / fixture / 记忆 / 补丁资产沉淀"],
  ["长期成本", "随使用线性增长", "固化使成熟流程单位成本递减（5→1→0）"],
  ["权限控制", "提示词约束为主", "capability 三态：编译期检查 + 审计事件"],
];

export function Why() {
  return (
    <section id="why" className="scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeading
          kicker="why"
          title="现有框架派任务，ORG 攒资产"
          desc="现有 Agent 框架回答「怎么派一个子任务」；ORG 回答「怎么让子智能体成为可积累的组织能力」。同一个任务第二次到来时，成本结构与第一次完全不同。"
        />
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50 text-left">
                <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                  维度
                </th>
                <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                  现有 sub-agent 体系
                </th>
                <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-widest text-emerald-500">
                  ORG
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {COMPARISON.map(([dim, old, org]) => (
                <tr key={dim} className="transition-colors hover:bg-zinc-900/40">
                  <td className="px-5 py-3.5 font-medium text-zinc-300">{dim}</td>
                  <td className="px-5 py-3.5 text-zinc-500">{old}</td>
                  <td className="px-5 py-3.5 text-zinc-200">{org}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// 六大部件 → 已迁移至 architecture-map.tsx（交互式拓扑图 + 部件卡联动）
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// 运行时动力学
// ----------------------------------------------------------------------------

const DYNAMICS = [
  {
    k: "固化",
    t: "成熟流程逐渐变成代码",
    d: "判定节点（需要 LLM 的开放判断）输出长期稳定即冻结为纯函数；命中零模型调用。降级是生命线：命中率因输入分布漂移而下降时，自动解冻最旧键、回滚本轮新冻结，回归观测。",
    tag: "crystallize_hit · crystallize_degrade",
  },
  {
    k: "事件溯源",
    t: "确定性重放 = 日志 + 代码版本",
    d: "全部事件 append-only 留痕（events.jsonl）+ 按监督回路阶段归类的人可读期刊（journal.jsonl）。scripted 剧本即当时的模型响应录制，org replay 重演时间线。",
    tag: "org replay --run demo-run/out-a",
  },
  {
    k: "评分卡",
    t: "客观证据结构性优先于裁判打分",
    d: "能力轴 × 任务类矩阵，每格分数 + 置信度。fixture 通过率 / 裁决率 / 预算遵守 / 固化命中（客观档权重 1.0），影子对比（裁判档 0.5）。evidence_count 跨运行累计。",
    tag: "evidence-ledger.json",
  },
  {
    k: "影子晋升",
    t: "补丁先当影子，再当正式工",
    d: "旧版本自动归档，候选与在岗同输入双跑，产出全一致才金丝雀确认，分歧即回滚。N 版本冗余向实现来源多样的专家镜像派单，分歧率是健康度指标。",
    tag: "canary_confirmed · redundancy_compare",
  },
];

export function Dynamics() {
  return (
    <section id="dynamics" className="scroll-mt-16 border-t border-zinc-800/80">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeading
          kicker="dynamics"
          title="运行时动力学"
          desc="系统不只执行任务——它的行为随使用持续变化，且每一步变化都有事件留痕、可审计、可回滚。"
        />
        <div className="grid gap-px overflow-hidden rounded-xl border border-zinc-800 bg-zinc-800 md:grid-cols-2">
          {DYNAMICS.map((d) => (
            <article key={d.k} className="bg-card p-6 md:p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-600">
                {d.k}
              </p>
              <h3 className="mt-3 font-mono text-lg font-semibold text-zinc-100">{d.t}</h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-zinc-400">{d.d}</p>
              <p className="mt-4 inline-block rounded border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[11px] text-zinc-500">
                {d.tag}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// 设计铁律
// ----------------------------------------------------------------------------

const RULES: Array<[string, string]> = [
  ["调度权可绕，知情权与记账权不可绕", "直连不是旁路：总线可见、预算入账、纪要回写，三者不可协商。"],
  ["权限跟随委托链", "编排模式适用静态最小权限；用户亲自委托时适用用户自身的权限范围。"],
  ["天花板管缺席，确认管在场", "用户不在场用静态能力约束兜底；用户在场用动态确认替代静态天花板。"],
  ["同一意见第二次出现，修专家本体", "审查反馈复发自动升级为补丁提案，进入与新品生成相同的验收管线。"],
  ["裁决者不自我裁决，主控是内核", "主控可提案修改专家，不可修改自身的编排图与审查标准。"],
  ["客观证据结构性优先于裁判证据", "审查的客观闸门（预算/覆盖率）先于语义裁决；行为信号权重高于裁判打分。"],
];

export function Principles() {
  return (
    <section id="principles" className="scroll-mt-16 border-t border-zinc-800/80 bg-zinc-950/50">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeading kicker="principles" title="设计铁律" />
        <ol className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          {RULES.map(([t, d], i) => (
            <li key={t} className="flex gap-5">
              <span
                className="font-mono text-2xl font-semibold text-zinc-800"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-mono text-[15px] font-semibold leading-snug text-zinc-100">
                  {t}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-zinc-500">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

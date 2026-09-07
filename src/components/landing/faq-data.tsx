// ---------------------------------------------------------------------------
// FAQ 单一事实源：faq.tsx（渲染）与 page.tsx（FAQPage JSON-LD）共用。
// a 中的 `反引号` 段渲染为 <code>；注入 JSON-LD 时去反引号即纯文本，
// 避免两处维护同一份问答造成漂移。
// ---------------------------------------------------------------------------

export const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "ORG 与 LangChain / CrewAI 这类框架有什么本质区别？",
    a: "主流框架把子智能体写成「一次性函数」：跑完即弃，质量靠人肉 review。ORG 把子智能体当作工程资产管理——用 HSL 拓扑描述（可校验、可验收、可版本化），任务结束沉淀回注册表，成熟流程下次直接复用。实测同类任务模型调用 `5 → 1 → 0` 递减，这是架构带来的，不是提示词技巧。",
  },
  {
    q: "什么是 HSL？为什么用文本格式描述智能体？",
    a: "HSL（Harness Specification Language）是一门用 BNF 语法定义的小型语言：`graph / node / edge` 描述拓扑，`#[capability(...)]` 声明能力，native 块承载实现。文本格式的核心价值是「运行前可校验」——`dhv check` 依据 S1–S8 / G1–G6 铁律在执行前发现结构错误，就像 TypeScript 之于 JavaScript。规范与解释器在 `harness-specification-language` 仓库开源。",
  },
  {
    q: "没有 LLM API key 能跑起来吗？",
    a: "能。ORG 内置 scripted 模式：模型响应由 fixture 录制回放，确定性重放，不花额度。`bun cli/org.ts demo` 与官网 TUI 演示均为 scripted 跑通；接真实模型只需把配置换到实际端点，评分卡支持按模型记录 evidence 并做金丝雀影子晋升。",
  },
  {
    q: "单二进制 org-*.zip 里到底装了什么？",
    a: "bun compile 打包的完整运行时：`hsl/` 全部源码 + dhv-ts 解释器 + demo 工作区与 fixtures。首次运行按内容寻址解包到 `~/.org/runtime-<hash>`（多版本共存）。不需要安装 Bun、Node 或任何依赖——下载解压、放进 PATH 就能用。",
  },
  {
    q: "现场生成的专家怎么保证不跑偏？",
    a: "工厂五步闸门：规格提取 → HSL 生成 → `dhv check` 结构校验 → fixture 行为验收（scripted 模式跑 exam）→ 入库登记。任何一步不合格，专家进不了注册表；上线后监督回路还有 Accept / Revise / Reject / Escalate 四态裁决，同一缺陷复发两次自动触发升级补丁提案。",
  },
  {
    q: "支持哪些操作系统和架构？",
    a: "v0.4.0 起官方分发五个单文件目标：Windows x64、macOS（Apple Silicon / Intel）、Linux（x64 / arm64），覆盖主流桌面与树莓派、ARM 服务器。源码方式适用面更广，仅需 Bun 1.3+，克隆即跑。",
  },
  {
    q: "MCP / A2A 协议现在能用吗？",
    a: "`adapters/bridge.hsl` 提供三平台导入线：MCP server、A2A agent、外部 subagent 均可登记进注册表（含能力声明与来源标记）。当前版本完成「导入登记」，协议翻译与执行接线在路线图（README P7 / P8）——先让外部专家可发现、可审计，再谈在岗执行。",
  },
  {
    q: "遇到 bug 或想参与，去哪里？",
    a: "产品本体与 issue 跟踪在 `myh2026/org`（MIT，69 项机制级测试 + TUI 冒烟 20 断言）；HSL 语言与工具链在 `harness-specification-language`——本项目已向该仓库回馈多项 dhv-ts 实测修复。欢迎 issue 与 PR。",
  },
];

/** 反引号标记 → JSX（偶数段为正文，奇数段为代码）。 */
export function renderFaqAnswer(a: string): React.ReactNode {
  return a.split(/`([^`]+)`/g).map((part, i) =>
    i % 2 === 1 ? (
      <code key={i}>{part}</code>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

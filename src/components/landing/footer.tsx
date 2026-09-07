import { Terminal } from "lucide-react";

const GITHUB = "https://github.com/myh2026/org";

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "产品",
    links: [
      { label: "为什么是 ORG", href: "#why" },
      { label: "六大部件", href: "#architecture" },
      { label: "运行时动力学", href: "#dynamics" },
      { label: "真实运行产物", href: "#replay" },
      { label: "主控源码", href: "#source" },
      { label: "TUI 驾驶舱", href: "#tui" },
      { label: "常见问题", href: "#faq" },
      { label: "快速开始", href: "#quickstart" },
    ],
  },
  {
    title: "仓库",
    links: [
      { label: "GitHub", href: GITHUB },
      { label: "Releases", href: `${GITHUB}/releases` },
      { label: "CHANGELOG", href: `${GITHUB}/blob/main/CHANGELOG.md` },
      { label: "BUGFIXES（HSL 实测）", href: `${GITHUB}/blob/main/BUGFIXES.md` },
    ],
  },
  {
    title: "HSL",
    links: [
      { label: "语言规范仓库", href: "https://github.com/myh2026/harness-specification-language" },
      {
        label: "BNF v1.5.0",
        href: "https://github.com/myh2026/harness-specification-language/blob/main/toolchain/hsl-spec/BNF.md",
      },
      {
        label: "语言指南",
        href: "https://github.com/myh2026/harness-specification-language/blob/main/guide/HSL-GUIDE.md",
      },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-800/80 bg-zinc-950 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10">
                <Terminal className="h-3.5 w-3.5 text-emerald-500" />
              </span>
              <span className="font-mono text-sm font-semibold text-zinc-100">org</span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-zinc-500">
              基于 HSL 的组织化多智能体系统。子智能体可生成、可验收、可复用、可演进。
            </p>
            <p className="mt-4 font-mono text-[11px] text-zinc-600">
              MIT License · v0.4.1 · BNF v1.5.0
            </p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                {col.title}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-[13px] text-zinc-400 transition-colors hover:text-zinc-100"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 border-t border-zinc-800/60 pt-6 font-mono text-[11px] text-zinc-600">
          ORG — Organization Harness · 成熟流程的单位成本随使用递减
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ClipboardCopy,
  ExternalLink,
  Hash,
  Keyboard,
  SquareTerminal,
} from "lucide-react";

// ---------------------------------------------------------------------------
// ⌘K 命令面板：OpenCode 风格的键盘优先导航。
// goto = 页内跳转 / copy = 复制到剪贴板 / open = 新标签外链 /
// tui = 产品 TUI 命令彩蛋（:demo / :filter 直接驱动下方演示，与真实 TUI 同语义）。
// keys = 打开快捷键总览浮层（与全局 ? 键同一事件总线 org:open-keys）。
// 打开方式：⌘K / Ctrl+K，或 nav 上的 ⌘K 按钮（dispatch "org:open-palette"）。
// ---------------------------------------------------------------------------

type CmdKind = "goto" | "copy" | "open" | "tui" | "keys";

interface Cmd {
  kind: CmdKind;
  cmd: string; // 面板中展示的命令行
  desc: string;
  target: string; // goto: section id · copy: 文本 · open: url
  keywords?: string;
}

const CMDS: Cmd[] = [
  { kind: "goto", cmd: "goto #top", desc: "回到顶部", target: "top" },
  { kind: "goto", cmd: "goto #why", desc: "为什么是组织化", target: "why", keywords: "为什么 why" },
  { kind: "goto", cmd: "goto #architecture", desc: "六大部件拓扑", target: "architecture", keywords: "架构 六大部件" },
  { kind: "goto", cmd: "goto #dynamics", desc: "运行时动力学", target: "dynamics", keywords: "动力学 固化 溯源" },
  { kind: "goto", cmd: "goto #replay", desc: "真实运行产物", target: "replay", keywords: "产物 journal events 回放" },
  { kind: "goto", cmd: "goto #source", desc: "主控源码（真实 HSL）", target: "source", keywords: "源码 hsl 内核 org.hsl" },
  { kind: "goto", cmd: "goto #principles", desc: "设计铁律", target: "principles", keywords: "铁律 原则" },
  { kind: "goto", cmd: "goto #tui", desc: "TUI 组织驾驶舱", target: "tui", keywords: "终端 tui 演示" },
  { kind: "goto", cmd: "goto #changelog", desc: "版本历史", target: "changelog", keywords: "版本 changelog 发布" },
  { kind: "goto", cmd: "goto #quickstart", desc: "快速开始", target: "quickstart", keywords: "快速开始 上手" },
  { kind: "goto", cmd: "goto #faq", desc: "常见问题", target: "faq", keywords: "faq 问题" },
  { kind: "goto", cmd: "goto #download", desc: "下载与安装", target: "download", keywords: "下载 二进制 平台" },
  { kind: "tui", cmd: ":demo", desc: "重播 TUI 组织驾驶舱演示", target: "replay", keywords: "tui 演示 重播 回放 demo" },
  { kind: "tui", cmd: ":filter 直连", desc: "演示：仅看直连问答", target: "direct", keywords: "过滤 直连 ask" },
  { kind: "tui", cmd: ":filter 裁决", desc: "演示：仅看审查裁决", target: "review", keywords: "过滤 裁决 review accept revise" },
  { kind: "tui", cmd: ":filter 工厂", desc: "演示：仅看专家工厂", target: "factory", keywords: "过滤 工厂 mint factory" },
  {
    kind: "copy",
    cmd: "copy git clone",
    desc: "复制克隆命令",
    target: "git clone https://github.com/myh2026/org.git",
  },
  {
    kind: "copy",
    cmd: "copy install unix",
    desc: "macOS / Linux 安装命令",
    target:
      "curl -LO https://github.com/myh2026/org/releases/latest/download/org-linux-x64.zip\nunzip org-linux-x64.zip\ninstall org /usr/local/bin/\norg",
  },
  {
    kind: "copy",
    cmd: "copy install windows",
    desc: "PowerShell 安装命令",
    target:
      'Invoke-WebRequest "https://github.com/myh2026/org/releases/latest/download/org-windows-x64.zip" -OutFile org-windows-x64.zip\nExpand-Archive org-windows-x64.zip -DestinationPath .\nMove-Item org.exe C:\\bin\\org.exe\norg',
  },
  {
    kind: "copy",
    cmd: "copy verify sha256",
    desc: "下载后完整性校验命令",
    target: "shasum -a 256 org-linux-x64.zip",
  },
  {
    kind: "open",
    cmd: "open github/myh2026/org",
    desc: "产品仓库",
    target: "https://github.com/myh2026/org",
  },
  {
    kind: "open",
    cmd: "open releases",
    desc: "全部版本与二进制资产",
    target: "https://github.com/myh2026/org/releases",
  },
  {
    kind: "open",
    cmd: "open hsl-spec",
    desc: "HSL 语言规范仓库",
    target: "https://github.com/myh2026/harness-specification-language",
  },
  {
    kind: "keys",
    cmd: ":keys",
    desc: "快捷键总览（? 键等效）",
    target: "keys",
    keywords: "keys 快捷键 键盘 帮助 help",
  },
];

const KIND_META: Record<CmdKind, { label: string; cls: string; Icon: typeof Hash }> = {
  goto: { label: "goto", cls: "border-sky-500/40 bg-sky-500/10 text-sky-400", Icon: ArrowRight },
  copy: {
    label: "copy",
    cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    Icon: ClipboardCopy,
  },
  open: {
    label: "open",
    cls: "border-violet-500/40 bg-violet-500/10 text-violet-400",
    Icon: ExternalLink,
  },
  tui: {
    label: "tui",
    cls: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    Icon: SquareTerminal,
  },
  keys: {
    label: "keys",
    cls: "border-rose-500/40 bg-rose-500/10 text-rose-400",
    Icon: Keyboard,
  },
};

function matchCmd(c: Cmd, q: string): boolean {
  if (!q) return true;
  const hay = `${c.cmd} ${c.desc} ${c.keywords ?? ""}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((tok) => hay.includes(tok));
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => CMDS.filter((c) => matchCmd(c, query)), [query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSel(0);
    setCopied(false);
  }, []);

  // 全局快捷键：⌘K / Ctrl+K 打开，Esc 关闭；事件总线（nav 按钮）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("org:open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("org:open-palette", onOpen);
    };
  }, [open, close]);

  // 打开时聚焦输入框；关闭时归还焦点
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }, [open]);

  // 过滤变化后选中项与滚动位置复位（在 onChange 内处理，避免 effect 中 setState）
  const onQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSel(0);
    listRef.current?.scrollTo({ top: 0 });
  };

  // 卸载时清 timer
  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  // 面板内唤起快捷键总览：关面板 → 总览浮层（与 ? 全局键 / :keys 命令同一总线）。
  // 必须先于 run 定义——run 的依赖数组在渲染期求值，后置声明会触发 TDZ。
  const openKeys = useCallback(() => {
    close();
    requestAnimationFrame(() => window.dispatchEvent(new CustomEvent("org:open-keys")));
  }, [close]);

  const run = useCallback(
    (c: Cmd) => {
      if (c.kind === "goto") {
        close();
        // 关闭动画后再滚动，避免 backdrop 淡出与平滑滚动抢帧
        requestAnimationFrame(() => {
          document.getElementById(c.target)?.scrollIntoView({ behavior: "smooth" });
        });
        return;
      }
      if (c.kind === "tui") {
        // 产品命令彩蛋：滚到 TUI 区并驱动演示（重播 / 设置事件过滤）
        close();
        requestAnimationFrame(() => {
          document.getElementById("tui")?.scrollIntoView({ behavior: "smooth" });
          window.dispatchEvent(
            new CustomEvent("org:demo-cmd", {
              detail: c.target === "replay" ? { replay: true } : { filter: c.target },
            }),
          );
        });
        return;
      }
      if (c.kind === "copy") {
        navigator.clipboard
          .writeText(c.target)
          .catch(() => {
            // 剪贴板不可用（http 环境）时静默降级
          });
        setCopied(true);
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(close, 850);
        return;
      }
      if (c.kind === "keys") {
        openKeys();
        return;
      }
      window.open(c.target, "_blank", "noreferrer");
      close();
    },
    [close, openKeys],
  );

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "?") {
      e.preventDefault();
      openKeys();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => (filtered.length ? (s + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => (filtered.length ? (s - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const c = filtered[sel];
      if (c) run(c);
    }
  };

  // 选中项跟随键盘滚入视野
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${sel}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="命令面板"
        className="w-full max-w-xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60"
      >
        {/* 标题栏 */}
        <div className="flex items-center gap-1.5 border-b border-zinc-800/80 bg-black/30 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-zinc-800" />
          <span className="h-2 w-2 rounded-full bg-zinc-800" />
          <span className="h-2 w-2 rounded-full bg-emerald-600/70" />
          <span className="ml-2 font-mono text-[11px] text-zinc-600">
            command palette · org
          </span>
          <span className="ml-auto font-mono text-[10.5px] text-zinc-700">⌘K</span>
        </div>

        {/* 输入行 */}
        <div className="flex items-center gap-2 border-b border-zinc-800/80 px-4 py-3">
          <span aria-hidden="true" className="select-none font-mono text-sm text-emerald-500">
            &gt;
          </span>
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-listbox"
            aria-label="搜索命令"
            value={query}
            onChange={onQueryChange}
            onKeyDown={onInputKey}
            placeholder="输入命令或关键词过滤…"
            className="min-w-0 flex-1 bg-transparent font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          />
          {copied && (
            <span className="shrink-0 font-mono text-[11px] text-emerald-400">✓ copied</span>
          )}
        </div>

        {/* 命令列表 */}
        <div
          id="palette-listbox"
          role="listbox"
          aria-label="命令列表"
          ref={listRef}
          className="scrollbar-thin max-h-[46vh] overflow-y-auto p-1.5"
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center font-mono text-[12px] text-zinc-600">
              无匹配命令 — <span className="text-zinc-500">esc</span> 关闭
            </p>
          ) : (
            filtered.map((c, i) => {
              const meta = KIND_META[c.kind];
              const Icon = meta.Icon;
              const on = i === sel;
              return (
                <button
                  key={c.cmd}
                  type="button"
                  role="option"
                  aria-selected={on}
                  data-idx={i}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => run(c)}
                  className={`relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
                    on ? "bg-emerald-500/10" : "hover:bg-zinc-900"
                  }`}
                >
                  {on && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-emerald-400"
                    />
                  )}
                  <span
                    className={`flex shrink-0 items-center gap-1 rounded border px-1 py-px font-mono text-[10px] leading-tight ${meta.cls}`}
                  >
                    <Icon className="h-2.5 w-2.5" />
                    {meta.label}
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate font-mono text-[12.5px] ${
                      on ? "text-zinc-100" : "text-zinc-300"
                    }`}
                  >
                    {c.cmd}
                  </span>
                  <span className="hidden shrink-0 font-mono text-[11px] text-zinc-600 sm:inline">
                    {c.desc}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* 键位提示（? 总览可点击，触屏设备由此进入） */}
        <div className="flex items-center gap-4 border-t border-zinc-800/80 bg-black/30 px-4 py-2 font-mono text-[10.5px] text-zinc-600">
          <span>↑↓ 选择</span>
          <span>↵ 执行</span>
          <span>esc 关闭</span>
          <button
            type="button"
            onClick={openKeys}
            title="键盘快捷键总览"
            className="rounded px-1 py-0.5 transition-colors hover:bg-zinc-900 hover:text-zinc-300"
          >
            ? 总览
          </button>
          <span className="ml-auto tabular-nums">
            {filtered.length}/{CMDS.length}
          </span>
        </div>
      </div>
    </div>
  );
}

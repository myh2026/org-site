"use client";

import { useEffect, useRef, useState } from "react";
import { Keyboard, X } from "lucide-react";

// ---------------------------------------------------------------------------
// 键盘快捷键总览（? / :keys 唤起）：像 `:help keys` 一样盘点本站全部键盘能力。
// 打开方式：任意位置按 ?（输入框内除外）· 命令面板输入 :keys · 面板底栏「? 总览」。
// 只列真实存在的绑定——不做发明，TUI 演示的键盘交互属于产品本体，不在此页。
// ---------------------------------------------------------------------------

interface KeyRow {
  keys: string[];
  desc: string;
  where?: string; // 补充说明（作用范围）
}

const ROWS: KeyRow[] = [
  { keys: ["⌘", "K"], desc: "打开 / 关闭命令面板", where: "Ctrl K 同效（Win/Linux）" },
  { keys: ["↑", "↓"], desc: "面板候选上下移动", where: "循环滚动" },
  { keys: ["↵"], desc: "执行选中的命令" },
  { keys: ["esc"], desc: "关闭面板 / 移动抽屉 / 本总览" },
  { keys: ["←", "→"], desc: "源码区切换文件 tab", where: "tab 聚焦时" },
  { keys: ["?"], desc: "打开本总览", where: "输入框外任意位置" },
];

const COLON_CMDS = [":demo", ":filter 裁决", ":keys"];

export function KeysOverlay() {
  const [open, setOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  // 全局 ? 唤起；Esc 关闭。输入类元素内不劫持（? 是合法输入）。
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const typing =
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable);
      if (e.key === "?" && !typing) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("org:open-keys", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("org:open-keys", onOpen);
    };
  }, [open]);

  // 焦点管理：打开聚焦关闭按钮，关闭归还焦点
  useEffect(() => {
    if (open) {
      restoreRef.current = document.activeElement as HTMLElement | null;
      const t = setTimeout(() => closeBtnRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
    restoreRef.current?.focus?.();
    restoreRef.current = null;
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="键盘快捷键总览"
        className="w-full max-w-md overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60"
      >
        {/* 标题栏：与命令面板 / 源码查看器同一套终端铬点视觉 */}
        <div className="flex items-center gap-1.5 border-b border-zinc-800/80 bg-black/30 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-zinc-800" />
          <span className="h-2 w-2 rounded-full bg-zinc-800" />
          <span className="h-2 w-2 rounded-full bg-emerald-600/70" />
          <span className="ml-2 flex min-w-0 items-center gap-1.5 font-mono text-[11px] text-zinc-500">
            <Keyboard className="h-3 w-3 text-zinc-600" />
            org · :help keys
          </span>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="关闭快捷键总览"
            className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-md border border-zinc-800 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 键位表 */}
        <ul className="divide-y divide-zinc-800/60 px-4 py-2">
          {ROWS.map((r) => (
            <li key={r.desc} className="flex items-center gap-3 py-2.5">
              <span className="flex w-24 shrink-0 items-center gap-1">
                {r.keys.map((k) => (
                  <kbd
                    key={k}
                    className="min-w-[1.75rem] rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-center font-mono text-[11px] text-zinc-200 shadow-[0_1px_0_rgba(0,0,0,0.5)]"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
              <span className="min-w-0 flex-1 text-[13px] leading-snug text-zinc-300">
                {r.desc}
                {r.where && (
                  <span className="ml-1.5 font-mono text-[10.5px] text-zinc-600">
                    {r.where}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>

        {/* : 前缀命令提示（属于面板用法，单列说明区） */}
        <div className="border-t border-zinc-800/80 bg-black/30 px-4 py-3">
          <p className="font-mono text-[10.5px] text-zinc-600">
            在 <span className="text-zinc-400">⌘K</span> 面板输入{" "}
            <span className="text-emerald-500">:</span> 前缀命令，直接驱动产品级交互：
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {COLON_CMDS.map((c) => (
              <code
                key={c}
                className="rounded border border-emerald-500/25 bg-emerald-500/[0.07] px-1.5 py-0.5 font-mono text-[11px] text-emerald-400"
              >
                {c}
              </code>
            ))}
          </div>
          <p className="mt-2.5 font-mono text-[10.5px] text-zinc-600">
            触屏设备：导航栏 <span className="text-zinc-400">⌘K</span> 按钮与面板底栏「? 总览」等效。
          </p>
        </div>
      </div>
    </div>
  );
}

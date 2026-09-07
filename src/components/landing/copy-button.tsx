"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** 命令复制按钮（终端美学的内联形态，hover 才浮现）。 */
export function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 剪贴板不可用时静默失败（按钮仍有视觉反馈）
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? "已复制" : "复制"}
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900/80 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300 ${className}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Github, Search } from "lucide-react";
import { CopyButton } from "./copy-button";

// ---------------------------------------------------------------------------
// 主控源码查看器：服务端读取的真实 HSL 源码（org 仓库工作树），客户端提供
// 多文件 tab + 行号 + 轻量 HSL 语法高亮 + 整文件复制。
// 高亮器是装饰性的（按行分词，覆盖注释/字符串/关键字/类型/属性/$host），
// 不做语义分析——真实把关者是 dhv check。
// ---------------------------------------------------------------------------

type TokCls = "cmt" | "str" | "kw" | "ty" | "num" | "attr" | "host" | "fn" | "punc" | "id" | "ws";
interface Tok {
  s: string;
  c: TokCls;
}

const KEYWORDS = new Set([
  "fn", "let", "enum", "struct", "export", "import", "if", "else", "match",
  "for", "in", "loop", "agentloop", "return", "true", "false", "Ok", "Err",
  "Some", "None", "mut", "pub", "as", "type", "const", "graph", "node",
  "edge", "on", "guard", "when", "then", "break", "continue", "native",
  "host", "macro", "rule", "traits", "self", "Self", "where", "impl", "use", "mod",
]);

const TOKEN_CLS: Record<TokCls, string> = {
  cmt: "italic text-zinc-600",
  str: "text-amber-300/90",
  kw: "text-emerald-400",
  ty: "text-sky-300",
  num: "text-orange-300/90",
  attr: "text-violet-400",
  host: "text-amber-400",
  fn: "text-zinc-100",
  punc: "text-zinc-600",
  id: "text-zinc-300",
  ws: "",
};

const NUM_RE = /^(?:0x[0-9a-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[ui](?:8|16|32|64|128|size))?)/;
const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*/;

/** 按行分词的装饰性 HSL 高亮器（无跨行状态——HSL 注释与字符串均为单行）。 */
export function tokenizeHslLine(line: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch === " " || ch === "\t") {
      let j = i;
      while (j < line.length && (line[j] === " " || line[j] === "\t")) j++;
      toks.push({ s: line.slice(i, j), c: "ws" });
      i = j;
      continue;
    }
    if (ch === "/" && line[i + 1] === "/") {
      toks.push({ s: line.slice(i), c: "cmt" });
      break;
    }
    if (ch === "#" && line[i + 1] === "[") {
      const end = line.indexOf("]", i);
      const s = end === -1 ? line.slice(i) : line.slice(i, end + 1);
      toks.push({ s, c: "attr" });
      i += s.length;
      continue;
    }
    if (ch === '"') {
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === "\\") {
          j += 2;
          continue;
        }
        if (line[j] === '"') {
          j++;
          break;
        }
        j++;
      }
      toks.push({ s: line.slice(i, j), c: "str" });
      i = j;
      continue;
    }
    if (ch === "$") {
      const m = /^\$host|^\$[a-z_][a-z0-9_]*/.exec(line.slice(i));
      const s = m ? m[0] : ch;
      toks.push({ s, c: "host" });
      i += s.length;
      continue;
    }
    if (ch >= "0" && ch <= "9") {
      const m = NUM_RE.exec(line.slice(i));
      const s = m ? m[0] : ch;
      toks.push({ s, c: "num" });
      i += s.length;
      continue;
    }
    const idm = IDENT_RE.exec(line.slice(i));
    if (idm) {
      const w = idm[0];
      if (KEYWORDS.has(w)) toks.push({ s: w, c: "kw" });
      else if (line[i + w.length] === "(") toks.push({ s: w, c: "fn" });
      else if (w[0] >= "A" && w[0] <= "Z") toks.push({ s: w, c: "ty" });
      else toks.push({ s: w, c: "id" });
      i += w.length;
      continue;
    }
    toks.push({ s: ch, c: "punc" });
    i++;
  }
  return toks;
}

export interface SourceFile {
  rel: string; // 仓库内相对路径（hsl/ 下）
  label: string; // tab 标签
  desc: string; // 一句话职责
  code: string;
  url: string; // GitHub blob 链接
}

export function SourceViewer({ files }: { files: SourceFile[] }) {
  const [active, setActive] = useState(0);
  const [selLine, setSelLine] = useState<number | null>(null); // 选中的行号锚点
  const [anchorCopied, setAnchorCopied] = useState<string | null>(null); // ✓ 反馈
  const [query, setQuery] = useState(""); // grep 文本 或 :行号 / 纯数字
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const anchorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const f = files[active];

  const rawLines = useMemo(() => {
    // 去掉文件尾换行产生的空行，行数与 wc -l 一致
    const src = f.code.endsWith("\n") ? f.code.slice(0, -1) : f.code;
    return src.split("\n");
  }, [f.code]);
  const hl = useMemo(() => rawLines.map(tokenizeHslLine), [rawLines]);
  const lineCount = hl.length;

  // grep / 跳行模式解析：`:42` 或纯数字 → 跳行；其余非空文本 → 行内 grep
  const trimmed = query.trim();
  const jumpMode = /^:?\d+$/.test(trimmed);
  const jumpLine = jumpMode ? parseInt(trimmed.replace(":", ""), 10) : null;
  const jumpValid = jumpLine !== null && jumpLine >= 1 && jumpLine <= lineCount;
  const matchSet = useMemo(() => {
    if (!trimmed || jumpMode) return null;
    const q = trimmed.toLowerCase();
    const s = new Set<number>();
    rawLines.forEach((l, i) => {
      if (l.toLowerCase().includes(q)) s.add(i + 1);
    });
    return s;
  }, [trimmed, jumpMode, rawLines]);

  // 滚动到指定行：容器需 relative，行元素 offsetTop 才相对容器
  const scrollToLine = (n: number) => {
    const body = bodyRef.current;
    const el = body?.querySelector<HTMLElement>(`[data-line="${n}"]`);
    if (!body || !el) return;
    body.scrollTop = Math.max(0, el.offsetTop - body.clientHeight / 2);
  };

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (jumpValid) scrollToLine(jumpLine);
      else if (matchSet && matchSet.size) scrollToLine(Math.min(...matchSet));
    } else if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
    }
  };

  // tab 键盘导航：← → 循环切换
  const onTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const d = e.key === "ArrowRight" ? 1 : -1;
    const n = (active + d + files.length) % files.length;
    setActive(n);
    tabRefs.current[n]?.focus();
  };

  // 切文件时选中行、反馈与搜索复位
  const switchTo = (i: number) => {
    setActive(i);
    setSelLine(null);
    setAnchorCopied(null);
    setQuery("");
  };

  // 点行号：复制「rel:L行号」锚点（贴进 issue / PR / 聊天即可精确定位），
  // 再次点击同一行取消选中
  const copyAnchor = (n: number) => {
    if (selLine === n) {
      setSelLine(null);
      return;
    }
    setSelLine(n);
    const anchor = `${f.rel}:L${n}`;
    navigator.clipboard.writeText(anchor).catch(() => {
      // 剪贴板不可用时静默（选中态仍有视觉反馈）
    });
    setAnchorCopied(anchor);
    if (anchorTimer.current) clearTimeout(anchorTimer.current);
    anchorTimer.current = setTimeout(() => setAnchorCopied(null), 1400);
  };

  // 卸载时清 timer
  useEffect(() => {
    const id = anchorTimer.current;
    return () => {
      if (id) clearTimeout(id);
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40">
      <p className="sr-only">
        主控源码查看器，包含 {files.length} 个真实 HSL 源文件：{files.map((x) => x.label).join("、")}
        。当前查看 {f.label}，共 {lineCount} 行。
      </p>

      {/* 标题栏：铬点 + 仓库路径 + 行数 + 外链 + 复制 */}
      <div className="flex items-center gap-1.5 border-b border-zinc-800/80 bg-black/30 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-zinc-800" />
        <span className="h-2 w-2 rounded-full bg-zinc-800" />
        <span className="h-2 w-2 rounded-full bg-emerald-600/70" />
        <span className="ml-2 min-w-0 truncate font-mono text-[11px] text-zinc-500">
          org / hsl / <span className="text-zinc-400">{f.rel}</span>
        </span>
        {anchorCopied ? (
          <span className="ml-auto shrink-0 font-mono text-[10.5px] text-emerald-400" role="status">
            ✓ {anchorCopied}
          </span>
        ) : trimmed && jumpMode ? (
          <span
            className={`ml-auto shrink-0 font-mono text-[10.5px] tabular-nums ${
              jumpValid ? "text-zinc-500" : "text-rose-400"
            }`}
            role="status"
          >
            {jumpValid ? `↵ :${jumpLine} 跳转` : `✗ 超出 1–${lineCount}`}
          </span>
        ) : matchSet ? (
          <span
            className={`ml-auto shrink-0 font-mono text-[10.5px] tabular-nums ${
              matchSet.size ? "text-amber-400/90" : "text-zinc-500"
            }`}
            role="status"
          >
            {matchSet.size} 处匹配
          </span>
        ) : (
          <span className="ml-auto hidden shrink-0 font-mono text-[10.5px] tabular-nums text-zinc-600 sm:inline">
            {lineCount} 行 · 点行号复制锚点
          </span>
        )}
        <a
          href={f.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`在 GitHub 查看 ${f.rel}`}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900/80 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
        >
          <Github className="h-3.5 w-3.5" />
        </a>
        <CopyButton text={f.code} />
      </div>

      {/* 文件 tabs + 行内搜索（grep / :行号） */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 px-2 py-1.5">
        <div
          role="tablist"
          aria-label="源码文件"
          onKeyDown={onTabKey}
          className="scrollbar-thin flex min-w-0 flex-1 gap-1 overflow-x-auto"
        >
          {files.map((x, i) => {
            const on = i === active;
            return (
              <button
                key={x.rel}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls="source-panel"
                id={`source-tab-${i}`}
                tabIndex={on ? 0 : -1}
                onClick={() => switchTo(i)}
                className={`shrink-0 rounded-md px-2.5 py-1.5 font-mono text-[12px] transition-colors ${
                  on
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                }`}
              >
                {x.label}
              </button>
            );
          })}
        </div>
        <div className="relative shrink-0">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-600"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKey}
            placeholder="grep · :42"
            aria-label="源码行内搜索或跳转行号（Enter 跳转，Esc 清除）"
            spellCheck={false}
            className="w-28 rounded-md border border-zinc-800 bg-zinc-950 py-1 pl-7 pr-2 font-mono text-[11.5px] text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-500/50 sm:w-36"
          />
        </div>
      </div>

      {/* 代码体：行号 + 高亮（grep 命中行 amber 染色，与选中态 emerald 区分） */}
      <div
        id="source-panel"
        role="tabpanel"
        aria-labelledby={`source-tab-${active}`}
        ref={bodyRef}
        className="scrollbar-thin relative max-h-[560px] overflow-auto bg-zinc-950 py-3"
      >
        {hl.map((toks, i) => {
          const n = i + 1;
          const sel = selLine === n;
          const hit = matchSet?.has(n) ?? false;
          return (
            <div
              key={i}
              data-line={n}
              className={`relative flex ${
                sel
                  ? "bg-emerald-500/[0.07]"
                  : hit
                    ? "bg-amber-500/[0.07] hover:bg-amber-500/[0.1]"
                    : "hover:bg-emerald-500/[0.04]"
              }`}
            >
              {sel && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 h-full w-0.5 bg-emerald-400"
                />
              )}
              <button
                type="button"
                onClick={() => copyAnchor(n)}
                aria-label={`复制行锚点 ${f.rel}:L${n}`}
                aria-pressed={sel}
                title={`${f.rel}:L${n}`}
                className={`sticky left-0 z-10 w-12 shrink-0 select-none bg-zinc-950 pr-3 text-right font-mono text-[11px] leading-[1.6] tabular-nums transition-colors hover:text-emerald-400 ${
                  sel
                    ? "text-emerald-400"
                    : hit
                      ? "text-amber-400/90"
                      : "text-zinc-700"
                }`}
              >
                {n}
              </button>
              <code className="min-w-0 flex-1 whitespace-pre pr-4 font-mono text-[12.5px] leading-[1.6]">
                {toks.map((t, j) => (
                  <span key={j} className={TOKEN_CLS[t.c]}>
                    {t.s}
                  </span>
                ))}
                {toks.length === 0 ? " " : null}
              </code>
            </div>
          );
        })}
      </div>

      {/* 底栏：当前文件职责 + 语言规格 */}
      <div className="flex items-center gap-3 border-t border-zinc-800/80 bg-black/30 px-4 py-2">
        <p className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-500">{f.desc}</p>
        <span className="hidden shrink-0 font-mono text-[10.5px] text-zinc-600 md:inline">
          grep 文本 · :N 跳行 · ↵ 执行 · esc 清除
        </span>
        <span className="shrink-0 font-mono text-[10.5px] text-zinc-600">
          HSL v1.5.0 · dhv check 通过
        </span>
      </div>
    </div>
  );
}

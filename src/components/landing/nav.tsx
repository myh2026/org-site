"use client";

import { useEffect, useState } from "react";
import { Github, Menu, Terminal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const GITHUB = "https://github.com/myh2026/org";

const LINKS = [
  { href: "#why", label: "为什么" },
  { href: "#architecture", label: "架构" },
  { href: "#dynamics", label: "动力学" },
  { href: "#replay", label: "产物" },
  { href: "#source", label: "源码" },
  { href: "#tui", label: "TUI" },
  { href: "#changelog", label: "版本" },
  { href: "#faq", label: "FAQ" },
  { href: "#download", label: "下载" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [progress, setProgress] = useState(0); // 0..1 阅读进度
  const [menuOpen, setMenuOpen] = useState(false); // 移动端导航抽屉

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 8);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(window.scrollY / max, 1) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // scrollspy：视口上部 1/3 处命中的区块视为当前（与 sticky 头高度匹配）
  useEffect(() => {
    const ids = LINKS.map((l) => l.href.slice(1));
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(`#${e.target.id}`);
        }
      },
      // 窄条观察带：区块顶部越过视口 30% 线即点亮，离开 45% 线才熄灭
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // 抽屉打开时 Esc 关闭
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled
          ? "border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <nav
        aria-label="主导航"
        className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6"
      >
        <a href="#top" className="group flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10">
            <Terminal className="h-3.5 w-3.5 text-emerald-500" />
          </span>
          <span className="font-mono text-sm font-semibold tracking-tight text-zinc-100">
            org
            <span className="ml-1.5 hidden font-normal text-zinc-500 sm:inline">/ harness</span>
          </span>
        </a>

        <div className="hidden items-center gap-4 md:flex">
          {LINKS.map((l) => {
            const on = active === l.href;
            return (
              <a
                key={l.href}
                href={l.href}
                aria-current={on ? "true" : undefined}
                className={`font-mono text-[13px] transition-colors ${
                  on
                    ? "text-emerald-400"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                {l.label}
              </a>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* 移动端菜单开关：<md 时桌面链接隐藏，抽屉承担导航 */}
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "关闭导航菜单" : "打开导航菜单"}
            onClick={() => setMenuOpen((v) => !v)}
            className="h-8 w-8 px-0 text-zinc-300 hover:text-zinc-100 md:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          {/* ⌘K 命令面板触发：点击派发全局事件，由 CommandPalette 监听 */}
          <Button
            variant="ghost"
            size="sm"
            aria-label="打开命令面板（快捷键 Command K 或 Control K）"
            onClick={() => window.dispatchEvent(new CustomEvent("org:open-palette"))}
            className="hidden h-8 gap-1.5 px-2.5 font-mono text-[11px] text-zinc-400 hover:text-zinc-100 sm:flex"
          >
            <span className="rounded border border-zinc-700 bg-zinc-900 px-1 py-px text-[10px] leading-tight">
              ⌘K
            </span>
            <span className="hidden md:inline">命令</span>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2.5 font-mono text-[13px] text-zinc-300 hover:text-zinc-100"
          >
            <a href={GITHUB} target="_blank" rel="noreferrer">
              <Github className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">myh2026/org</span>
            </a>
          </Button>
          <Button
            asChild
            size="sm"
            className="h-8 bg-emerald-600 px-3 font-mono text-[13px] text-zinc-950 hover:bg-emerald-500"
          >
            <a href="#download">v0.4.1</a>
          </Button>
        </div>
      </nav>

      {/* 移动端导航抽屉：终端风格 section 链接面板 */}
      {menuOpen && (
        <div
          id="mobile-nav"
          className="absolute inset-x-0 top-full border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md md:hidden"
        >
          <nav aria-label="移动端导航" className="mx-auto grid max-w-6xl grid-cols-3 gap-1 px-4 py-3">
            {LINKS.map((l) => {
              const on = active === l.href;
              return (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={on ? "true" : undefined}
                  className={`rounded-lg border px-3 py-2.5 font-mono text-[13px] transition-colors ${
                    on
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-transparent text-zinc-300 hover:bg-zinc-900"
                  }`}
                >
                  {l.label}
                </a>
              );
            })}
          </nav>
          <div className="mx-auto flex max-w-6xl items-center gap-2 border-t border-zinc-800/60 px-4 py-2.5 font-mono text-[11px] text-zinc-600">
            <span aria-hidden="true" className="text-emerald-500">&gt;</span>
            <span>桌面端可用 ⌘K 打开命令面板</span>
            <span className="ml-auto tabular-nums">{LINKS.length} sections</span>
          </div>
        </div>
      )}

      {/* 阅读进度条：贴在 header 底缘的 emerald 细线 */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px overflow-hidden"
      >
        <div
          className="h-full bg-gradient-to-r from-emerald-600/60 to-emerald-400 transition-[width] duration-100 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </header>
  );
}

"use client";

import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// 阅读进度条：视口顶部 2px emerald 细线，随滚动推进。
// - 纯装饰（aria-hidden），rAF 节流的 passive scroll 监听，无重排开销
// - 直接写 transform，不经过 React state（滚动路径上零渲染）
// - z-[60]：位于 sticky 导航之上、⌘K 面板（z-70）之下
// ---------------------------------------------------------------------------

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let raf = 0;

    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5"
    >
      <div
        ref={barRef}
        className="h-full origin-left bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 will-change-transform"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}

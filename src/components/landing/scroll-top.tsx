"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// 回到顶部：滚动超过一屏后右下角浮现，终端风 `:^` 字符按钮。
// ---------------------------------------------------------------------------

export function ScrollTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setShow(window.scrollY > window.innerHeight));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() =>
        window.scrollTo({
          top: 0,
          // 减弱动态效果偏好：直接跳转，不做平滑滚动
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        })
      }
      aria-label="回到顶部"
      tabIndex={show ? 0 : -1}
      className={`fixed bottom-5 right-5 z-40 flex h-9 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950/90 px-2.5 font-mono text-[12px] text-zinc-400 shadow-lg shadow-black/40 backdrop-blur transition-all duration-300 hover:border-emerald-500/40 hover:text-emerald-400 ${
        show
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <span aria-hidden="true" className="text-emerald-500/80">:^</span>
      <span className="hidden sm:inline">top</span>
    </button>
  );
}

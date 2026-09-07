"use client";

import { useEffect, useState } from "react";
import { CircleDot, GitFork, Star } from "lucide-react";

// hero 下方实时仓库徽章：数据来自 /api/repo-stats（服务端 10min 缓存 + GitHub 鉴权）。
// 加载中不占位（避免布局跳动），失败或全零时整体隐藏——不显示虚构数字。

interface Stats {
  ok: boolean;
  stars: number;
  forks: number;
  open_issues: number;
}

const GITHUB = "https://github.com/myh2026/org";

export function RepoBadges() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/repo-stats")
      .then((r) => r.json())
      .then((d: Stats) => {
        if (alive) setS(d);
      })
      .catch(() => {
        // 拉取失败：保持 null → 不渲染
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!s?.ok || (s.stars === 0 && s.forks === 0 && s.open_issues === 0)) return null;

  const items = [
    {
      href: `${GITHUB}/stargazers`,
      label: `${s.stars} stars`,
      Icon: Star,
      hover: "hover:text-amber-300",
    },
    {
      href: `${GITHUB}/forks`,
      label: `${s.forks} forks`,
      Icon: GitFork,
      hover: "hover:text-sky-300",
    },
    {
      href: `${GITHUB}/issues`,
      label: `${s.open_issues} issues`,
      Icon: CircleDot,
      hover: "hover:text-emerald-300",
    },
  ];

  return (
    <div
      aria-label="GitHub 仓库统计（实时）"
      className="mt-5 flex items-center gap-5 font-mono text-[11.5px] text-zinc-500"
    >
      {items.map(({ href, label, Icon, hover }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={`GitHub ${label}`}
          className={`inline-flex items-center gap-1.5 transition-colors ${hover}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="tabular-nums">{label}</span>
        </a>
      ))}
      <span className="hidden select-none text-zinc-700 sm:inline">· 实时</span>
    </div>
  );
}

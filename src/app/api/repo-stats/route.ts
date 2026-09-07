import { NextResponse } from "next/server";

// /api/repo-stats — GitHub 仓库实时统计（stars / forks / open issues），
// hero 徽章的真实数据源。内存缓存 10 分钟（与 /api/release 同策略）；
// GitHub 不可达时返回 ok:false —— 前端直接隐藏徽章，绝不显示过期或虚构数字。

const REPO = "myh2026/org";
const CACHE_TTL_MS = 10 * 60 * 1000;

export interface RepoStats {
  ok: boolean;
  stars: number;
  forks: number;
  open_issues: number;
  pushed_at: string; // ISO 8601，最后一次推送
}

const EMPTY: RepoStats = { ok: false, stars: 0, forks: 0, open_issues: 0, pushed_at: "" };

let cache: { at: number; data: RepoStats } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return NextResponse.json(cache.data, { headers: { "x-cache": "hit" } });
  }
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "org-website",
    };
    // 与 /api/release 同策略：沙箱/共享 IP 未认证限额易耗尽，GITHUB_TOKEN → 5000/h
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const j = (await res.json()) as {
      stargazers_count?: number;
      forks_count?: number;
      open_issues_count?: number;
      pushed_at?: string;
    };
    const data: RepoStats = {
      ok: true,
      stars: j.stargazers_count ?? 0,
      forks: j.forks_count ?? 0,
      open_issues: j.open_issues_count ?? 0,
      pushed_at: j.pushed_at ?? "",
    };
    cache = { at: Date.now(), data };
    return NextResponse.json(data, { headers: { "x-cache": "miss" } });
  } catch {
    return NextResponse.json(EMPTY, { headers: { "x-cache": "fallback" } });
  }
}

import { NextResponse } from "next/server";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";

// /api/org-health — 构建工作树工程体检（全部静态实测，不执行产品代码）：
//   version   ← package.json
//   branch    ← git rev-parse --abbrev-ref HEAD
//   commit    ← git rev-parse --short HEAD
//   commitDate← git log -1 --format=%cI
//   modules   ← hsl/**/*.hsl 文件数（递归）
//   kernelLoc ← hsl/org.hsl 行数（与源码区同一去尾口径）
//   testFiles ← tests/*.test.ts 文件数
// 仓库缺席 / git 不可用时 ok:false —— 前端整条隐藏，绝不显示虚构数字。
// 内存缓存 10 分钟（与 /api/release、/api/repo-stats 同策略）。

const CACHE_TTL_MS = 10 * 60 * 1000;
const REPO_HOME = process.env.ORG_REPO_HOME ?? "/home/z/org";

export interface OrgHealth {
  ok: boolean;
  version: string;
  branch: string;
  commit: string;
  commitDate: string; // ISO 8601
  modules: number;
  kernelLoc: number;
  testFiles: number;
}

const EMPTY: OrgHealth = {
  ok: false,
  version: "",
  branch: "",
  commit: "",
  commitDate: "",
  modules: 0,
  kernelLoc: 0,
  testFiles: 0,
};

let cache: { at: number; data: OrgHealth } | null = null;

// 递归统计 hsl/ 下 .hsl 模块数（与 dhv check 的模块口径不同：这里只数真实文件）
function countModules(dir: string): number {
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) n += countModules(p);
    else if (e.isFile() && e.name.endsWith(".hsl")) n += 1;
  }
  return n;
}

function git(args: string): string | null {
  try {
    return execFileSync("git", args.split(" "), {
      cwd: REPO_HOME,
      timeout: 4000,
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
}

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return NextResponse.json(cache.data, { headers: { "x-cache": "hit" } });
  }
  try {
    // 版本：package.json（编译期权威来源）
    const pkg = JSON.parse(readFileSync(join(REPO_HOME, "package.json"), "utf8")) as {
      version?: string;
    };
    const branch = git("rev-parse --abbrev-ref HEAD") ?? "";
    const commit = git("rev-parse --short HEAD") ?? "";
    const commitDate = git("log -1 --format=%cI") ?? "";
    if (!pkg.version || !commit) throw new Error("repo metadata unavailable");

    const kernelSrc = readFileSync(join(REPO_HOME, "hsl", "org.hsl"), "utf8");
    const kernelLoc = (kernelSrc.endsWith("\n") ? kernelSrc.slice(0, -1) : kernelSrc).split("\n").length;

    let testFiles = 0;
    try {
      testFiles = readdirSync(join(REPO_HOME, "tests")).filter((f) =>
        f.endsWith(".test.ts"),
      ).length;
    } catch {
      testFiles = 0; // tests 目录缺席不致命
    }

    const data: OrgHealth = {
      ok: true,
      version: pkg.version,
      branch,
      commit,
      commitDate,
      modules: countModules(join(REPO_HOME, "hsl")),
      kernelLoc,
      testFiles,
    };
    cache = { at: Date.now(), data };
    return NextResponse.json(data, { headers: { "x-cache": "miss" } });
  } catch {
    return NextResponse.json(EMPTY, { headers: { "x-cache": "fallback" } });
  }
}

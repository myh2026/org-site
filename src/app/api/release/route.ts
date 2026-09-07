import { NextResponse } from "next/server";

// /api/release — 代理 GitHub 最新 Release（下载区块的真实数据源）。
// v0.4.0 起资产分两组：平台二进制（org-<平台>-<架构>.zip，5 个 bun compile 目标）与源码包。
// 附带探测每个资产的 .sha256 旁车文件（release.yml 生成，老版本无旁车则返回 null，
// 前端降级为展示官方校验命令）。内存缓存 10 分钟；GitHub 不可达时回退到内置静态数据
// ——文件名仍然正确，链接指向 releases/latest，size 置 0（前端显示 "—"）。

const REPO = "myh2026/org";
const CACHE_TTL_MS = 10 * 60 * 1000;
const LATEST_URL = `https://github.com/${REPO}/releases/latest`;

// 与分发矩阵一致（bun build --compile --target=<target> → 打包为 org-<短名>.zip）
const TARGETS = [
  "bun-linux-x64",
  "bun-linux-arm64",
  "bun-darwin-x64",
  "bun-darwin-arm64",
  "bun-windows-x64",
] as const;

type Target = (typeof TARGETS)[number];

// 目标 → Release 资产文件名（release.yml 打包名不含 "bun-" 前缀）
function assetName(target: Target): string {
  return `org-${target.replace(/^bun-/, "")}.zip`;
}

// 资产名 → 目标（兼容带/不带 bun- 前缀两种命名）
function targetOfAssetName(name: string): Target | null {
  const m = /^org-(?:bun-)?(linux|darwin|windows)-(x64|arm64)\.zip$/i.exec(name);
  if (!m) return null;
  const t = `bun-${m[1]!.toLowerCase()}-${m[2]!.toLowerCase()}`;
  return (TARGETS as readonly string[]).includes(t) ? (t as Target) : null;
}

interface RawAsset {
  name: string;
  size: number;
  download_count: number;
  browser_download_url: string;
}

export interface Asset extends RawAsset {
  target: Target | null; // 二进制产物对应的编译目标；源码包为 null
  sha256: string | null; // Release 旁车 <asset>.sha256 的内容；无旁车时为 null
}

export interface ReleasePayload {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  binaries: Asset[];    // 恒为 5 条（Release 缺某目标时合成占位，size=0）
  source: Asset | null; // 源码包（tar.gz 优先）
}

interface GithubRelease extends RawReleaseInfo {
  assets?: RawAsset[];
}

interface RawReleaseInfo {
  tag_name: string;
  name: string | null;
  published_at: string;
  html_url: string;
}

let cache: { at: number; data: ReleasePayload } | null = null;

function toAsset(a: RawAsset, target: Target | null, sha256: string | null = null): Asset {
  return {
    name: a.name,
    size: a.size,
    download_count: a.download_count,
    browser_download_url: a.browser_download_url,
    target,
    sha256,
  };
}

// 把 GitHub 原始资产列表整理为「5 个平台二进制 + 源码包」；
// 某目标缺失时合成占位（正确文件名 + releases/latest 链接 + size 0）。
function groupAssets(raw: RawAsset[]): { binaries: Asset[]; source: Asset } {
  const byTarget = new Map<string, RawAsset>();
  const rest: RawAsset[] = [];
  for (const a of raw) {
    const t = targetOfAssetName(a.name);
    if (t) byTarget.set(t, a);
    else rest.push(a);
  }
  const binaries: Asset[] = TARGETS.map((t) => {
    const hit = byTarget.get(t);
    return hit
      ? toAsset(hit, t)
      : { name: assetName(t), size: 0, download_count: 0, browser_download_url: LATEST_URL, target: t, sha256: null };
  });
  const src = rest.find((a) => a.name.endsWith(".tar.gz")) ?? rest[0];
  const source: Asset = src
    ? toAsset(src, null)
    : { name: "org-src.tar.gz", size: 0, download_count: 0, browser_download_url: LATEST_URL, target: null, sha256: null };
  return { binaries, source };
}

// 探测单个资产的 .sha256 旁车文件（内容形如 "<hash>  <filename>" 或纯 hash，取首段校验）
async function probeSidecar(downloadUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`${downloadUrl}.sha256`, {
      headers: { "User-Agent": "org-website" },
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const first = (await res.text()).trim().split(/\s+/)[0] ?? "";
    return /^[0-9a-f]{64}$/i.test(first) ? first.toLowerCase() : null;
  } catch {
    return null;
  }
}

// 给所有真实资产并行探测校验和（合成占位 / fallback 链接直接跳过，不发无谓请求）
async function attachChecksums(data: ReleasePayload): Promise<ReleasePayload> {
  const probeable = (a: Asset) => a.browser_download_url.includes("/releases/download/");
  const all: Asset[] = [...data.binaries, ...(data.source ? [data.source] : [])];
  await Promise.all(
    all.map(async (a) => {
      a.sha256 = probeable(a) ? await probeSidecar(a.browser_download_url) : null;
    }),
  );
  return data;
}

const FALLBACK: ReleasePayload = {
  tag_name: "v0.4.1",
  name: "v0.4.1 · TUI :filter + 官方 sha256 校验和",
  published_at: "",
  html_url: LATEST_URL,
  binaries: TARGETS.map((t) => ({
    name: assetName(t),
    size: 0,
    download_count: 0,
    browser_download_url: LATEST_URL,
    target: t as Target,
    sha256: null,
  })),
  source: {
    name: "org-v0.4.1-src.tar.gz",
    size: 0,
    download_count: 0,
    browser_download_url: LATEST_URL,
    target: null,
    sha256: null,
  },
};

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return NextResponse.json(cache.data, {
      headers: { "x-cache": "hit" },
    });
  }
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "org-website",
    };
    // 可选鉴权：沙箱/共享 IP 场景下未认证限额（60/h）极易耗尽，配置 GITHUB_TOKEN 后 5000/h
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const j = (await res.json()) as GithubRelease;
    const grouped = groupAssets(j.assets ?? []);
    const data = await attachChecksums({
      tag_name: j.tag_name,
      name: j.name ?? j.tag_name,
      published_at: j.published_at,
      html_url: j.html_url,
      ...grouped,
    });
    cache = { at: Date.now(), data };
    return NextResponse.json(data, { headers: { "x-cache": "miss" } });
  } catch {
    return NextResponse.json(FALLBACK, { headers: { "x-cache": "fallback" } });
  }
}

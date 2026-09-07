"use client";

import { useEffect, useState } from "react";
import {
  AppWindow,
  Download,
  FileArchive,
  Github,
  Monitor,
  Package,
  SquareTerminal,
  Tag,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "./copy-button";

// ---------------------------------------------------------------------------
// 类型与平台元数据（org-<target>.zip 与 Release 资产一一对应）
// ---------------------------------------------------------------------------

type Target =
  | "bun-linux-x64"
  | "bun-linux-arm64"
  | "bun-darwin-x64"
  | "bun-darwin-arm64"
  | "bun-windows-x64";

type OsKey = "windows" | "macos" | "linux";

interface Asset {
  name: string;
  size: number; // 0 = 未知（fallback），显示 "—"
  download_count: number;
  browser_download_url: string;
  target: Target | null;
  sha256: string | null; // Release 旁车文件；v0.4.0 无旁车 → null（前端降级为校验命令）
}

interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  binaries: Asset[];
  source: Asset | null;
}

const TARGET_META: Record<
  Target,
  { os: OsKey; label: string; arch: string; note: string }
> = {
  "bun-windows-x64": {
    os: "windows",
    label: "Windows",
    arch: "x64",
    note: "64 位 Windows 10 / 11",
  },
  "bun-darwin-arm64": {
    os: "macos",
    label: "macOS",
    arch: "Apple Silicon",
    note: "M1 / M2 / M3 / M4 系列芯片",
  },
  "bun-darwin-x64": {
    os: "macos",
    label: "macOS",
    arch: "Intel",
    note: "Intel 芯片机型",
  },
  "bun-linux-x64": {
    os: "linux",
    label: "Linux",
    arch: "x64",
    note: "主流桌面与服务器",
  },
  "bun-linux-arm64": {
    os: "linux",
    label: "Linux",
    arch: "arm64",
    note: "树莓派 / ARM 服务器",
  },
};

const TARGET_ORDER: Target[] = [
  "bun-windows-x64",
  "bun-darwin-arm64",
  "bun-darwin-x64",
  "bun-linux-x64",
  "bun-linux-arm64",
];

const OS_ICON: Record<OsKey, typeof AppWindow> = {
  windows: AppWindow,
  macos: Monitor,
  linux: Terminal,
};

// 访问者平台探测（仅客户端执行，避免水合不一致；无法识别时返回 null）
function detectTarget(): Target | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  const platform = navigator.platform || "";
  if (/Android|iPhone|iPad/i.test(ua)) return null; // 移动端不做推荐（iOS UA 含 "Mac OS X"，须先排除）
  if (/Win/i.test(ua)) return "bun-windows-x64";
  if (/Mac/i.test(ua)) return "bun-darwin-arm64"; // macOS 默认推荐 Apple Silicon，Intel 机型见并列卡
  if (/Linux|X11/i.test(ua)) {
    return /arm|aarch64/i.test(platform) ? "bun-linux-arm64" : "bun-linux-x64";
  }
  return null;
}

function fmtSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

const CLONE_CMD = "git clone https://github.com/myh2026/org.git";
const INSTALL_HINT = "下载解压 → 放入 PATH → 输入 org 启动 TUI";
const LATEST_BASE = "https://github.com/myh2026/org/releases/latest/download";

// 平台安装命令（zip 内为单文件 org / org.exe，与 release.yml 打包一致）
function installCmd(target: Target, url: string, name: string): string {
  if (target === "bun-windows-x64") {
    return [
      `Invoke-WebRequest "${url}" -OutFile ${name}`,
      `Expand-Archive ${name} -DestinationPath .`,
      `Move-Item org.exe C:\\bin\\org.exe   # C:\\bin 需已加入 PATH`,
      `org`,
    ].join("\n");
  }
  return [
    `curl -LO ${url}`,
    `unzip ${name}`,
    `install org /usr/local/bin/   # 或移动到任意 PATH 目录`,
    `org`,
  ].join("\n");
}

// 平台对应的官方校验命令（旁车 .sha256 缺席时的降级方案）
function verifyCmd(name: string, os: OsKey): string {
  return os === "windows"
    ? `Get-FileHash ${name} -Algorithm SHA256`
    : `shasum -a 256 ${name}`;
}

// 校验和截断展示：前 12 位 + … + 后 8 位
function shortHash(hash: string): string {
  return `${hash.slice(0, 12)}…${hash.slice(-8)}`;
}

// ---------------------------------------------------------------------------

export function DownloadSection() {
  const [release, setRelease] = useState<Release | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "fallback">("loading");
  const [detected, setDetected] = useState<Target | null>(null);

  useEffect(() => {
    // rAF 延迟探测：避免 effect 内同步 setState（水合后下一帧生效）
    const raf = requestAnimationFrame(() => setDetected(detectTarget()));
    let aborted = false;
    fetch("/api/release")
      .then((r) => r.json())
      .then((d: Release) => {
        if (aborted) return;
        setRelease(d);
        setState("ok");
      })
      .catch(() => {
        if (!aborted) setState("fallback");
      });
    return () => {
      aborted = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  const binaries: Asset[] = TARGET_ORDER.map(
    (t) =>
      release?.binaries.find((b) => b.target === t) ?? {
        name: `org-${t}.zip`,
        size: 0,
        download_count: 0,
        browser_download_url: "https://github.com/myh2026/org/releases/latest",
        target: t,
        sha256: null,
      },
  );
  const recommended = binaries.find((b) => b.target === detected) ?? null;
  const others = recommended
    ? binaries.filter((b) => b.target !== detected)
    : binaries;

  return (
    <section id="download" className="scroll-mt-16 border-t border-zinc-800/80 bg-zinc-950/50">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        {/* 标题 */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
          <div>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-500">
              download
            </p>
            <h2 className="font-mono text-2xl font-semibold tracking-tight text-zinc-100 md:text-3xl">
              下载与安装
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
              v0.4.1 起提供 Windows / macOS / Linux 单文件可执行（bun compile，零运行时依赖）：
              下载解压 → 放入 PATH → 输入 <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[12px] text-zinc-300">org</code> 即进入组织驾驶舱。
            </p>
          </div>
          {release ? (
            <div className="flex items-center gap-2">
              {binaries.reduce((s, b) => s + b.download_count, 0) +
                (release.source?.download_count ?? 0) >
                0 && (
                <span
                  className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 font-mono text-[11px] text-zinc-400"
                  title="GitHub Releases 累计下载次数（5 平台二进制 + 源码包）"
                >
                  <Download className="h-3 w-3" />
                  Σ {binaries.reduce((s, b) => s + b.download_count, 0) + (release.source?.download_count ?? 0)} 次下载
                </span>
              )}
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] text-emerald-500">
                <Tag className="h-3 w-3" />
                {release.tag_name}
              </span>
            </div>
          ) : (
            <Skeleton className="h-6 w-20 rounded-full" />
          )}
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.35fr] lg:gap-14">
          {/* 左：源码与仓库 */}
          <div className="min-w-0">
            <h3 className="font-mono text-sm font-semibold text-zinc-200">源码方式</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
              源码与编译产物同库交付：克隆后无需构建，
              <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[12px] text-zinc-300">
                bun cli/org.ts check
              </code>
              直接全量校验，MIT 许可。
            </p>

            <div className="mt-5 flex max-w-md items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-4 pr-2.5">
              <code className="scrollbar-thin min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[12px] text-zinc-400">
                <span className="select-none text-emerald-600">$ </span>
                {CLONE_CMD}
              </code>
              <CopyButton text={CLONE_CMD} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                asChild
                className="h-10 bg-emerald-600 px-5 font-mono text-sm text-zinc-950 hover:bg-emerald-500"
              >
                <a
                  href="https://github.com/myh2026/org/releases"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github className="mr-1.5 h-4 w-4" />
                  GitHub Releases
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 border-zinc-800 bg-transparent px-5 font-mono text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
              >
                <a
                  href="https://github.com/myh2026/harness-specification-language"
                  target="_blank"
                  rel="noreferrer"
                >
                  HSL 语言规范
                </a>
              </Button>
            </div>

            {/* 源码包 */}
            <div className="mt-8 rounded-xl border border-zinc-800 bg-card">
              <div className="flex items-center gap-2.5 border-b border-zinc-800/80 px-5 py-3.5">
                <Package className="h-4 w-4 text-emerald-500" />
                <span className="font-mono text-[13px] font-semibold text-zinc-100">
                  源码包 · {release ? release.name : "latest release"}
                </span>
              </div>
              {state === "loading" ? (
                <div className="px-5 py-4">
                  <Skeleton className="h-4 w-48" />
                </div>
              ) : release?.source ? (
                <a
                  href={release.source.browser_download_url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-zinc-900/60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileArchive className="h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-emerald-500" />
                    <span className="truncate font-mono text-[13px] text-zinc-300 group-hover:text-zinc-100">
                      {release.source.name}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-[11px] text-zinc-500">
                      {fmtSize(release.source.size)}
                      {release.source.download_count > 0
                        ? ` · ${release.source.download_count} 次`
                        : ""}
                    </span>
                    <Download className="h-3.5 w-3.5 text-zinc-600 transition-colors group-hover:text-emerald-500" />
                  </div>
                </a>
              ) : null}
              {release?.published_at && release.source ? (
                <>
                  <div className="border-t border-zinc-800/80 px-5 py-3 font-mono text-[11px] text-zinc-600">
                    发布于 {fmtDate(release.published_at)} · MIT License · 本页数据缓存 10 分钟
                  </div>
                  {/* 校验行：旁车优先，否则展示 shasum 命令 */}
                  <div className="flex items-center gap-2 border-t border-zinc-800/80 px-5 py-3">
                    <span
                      className={`shrink-0 rounded border px-1.5 py-px font-mono text-[11px] ${
                        release.source.sha256
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                          : "border-zinc-700 bg-zinc-900 text-zinc-500"
                      }`}
                    >
                      {release.source.sha256 ? "✓ sha256" : "verify"}
                    </span>
                    <code className="scrollbar-thin min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[11px] text-zinc-500">
                      {release.source.sha256
                        ? shortHash(release.source.sha256)
                        : verifyCmd(release.source.name, "linux")}
                    </code>
                    <CopyButton
                      text={release.source.sha256 ?? verifyCmd(release.source.name, "linux")}
                    />
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* 右：平台分发卡 */}
          <div className="min-w-0">
            <h3 className="font-mono text-sm font-semibold text-zinc-200">
              平台分发包
              <span className="ml-2 font-normal text-zinc-600">org-&lt;target&gt;.zip</span>
            </h3>

            {state === "loading" ? (
              <div className="mt-4 space-y-4">
                <Skeleton className="h-[136px] w-full rounded-xl" />
                <div className="grid gap-4 sm:grid-cols-2">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[104px] rounded-xl" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {/* 推荐卡（按访问者 OS 置顶高亮） */}
                {recommended ? (
                  <RecommendedCard asset={recommended} />
                ) : (
                  <p className="rounded-lg border border-zinc-800 bg-card px-4 py-3 text-[12.5px] text-zinc-500">
                    未识别到桌面平台——下面列出全部产物，选择与你系统匹配的一项。
                  </p>
                )}

                {/* 其余平台并列 */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {others.map((b) => {
                    const meta = TARGET_META[b.target as Target];
                    const Icon = OS_ICON[meta.os];
                    return (
                      <a
                        key={b.target}
                        href={b.browser_download_url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex min-w-0 flex-col rounded-xl border border-zinc-800 bg-card p-4 transition-colors hover:border-emerald-500/40 hover:bg-zinc-900/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-zinc-200">
                            <Icon className="h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-emerald-500" />
                            {meta.label} · {meta.arch}
                          </span>
                          <Download className="h-3.5 w-3.5 shrink-0 text-zinc-600 transition-colors group-hover:text-emerald-500" />
                        </div>
                        <p className="mt-2.5 min-w-0 truncate font-mono text-[12px] text-zinc-400">
                          {b.name}
                        </p>
                        <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                          <span className="shrink-0 font-mono text-[11px] text-zinc-500">
                            {fmtSize(b.size)}
                            {b.download_count > 0 ? ` · ${b.download_count} 次` : ""}
                          </span>
                          <span className="min-w-0 truncate font-mono text-[11px] text-zinc-600">
                            {meta.note}
                          </span>
                        </div>
                      </a>
                    );
                  })}
                </div>

                <p className="font-mono text-[11px] leading-relaxed text-zinc-600">
                  每卡安装方式：{INSTALL_HINT}。文件大小与下载计数以 GitHub Releases 页为准。
                </p>

                {/* 安装命令生成器：选平台 → 复制整段命令 */}
                <InstallGenerator assets={binaries} detected={detected} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 推荐卡：高亮置顶，含下载图标、平台名与一键下载
// ---------------------------------------------------------------------------

function RecommendedCard({ asset }: { asset: Asset }) {
  const meta = TARGET_META[asset.target as Target];
  const Icon = OS_ICON[meta.os];
  const archTip =
    meta.os === "macos"
      ? "Intel 机型请选下方 darwin-x64"
      : meta.os === "linux"
        ? "ARM 设备请选下方 linux-arm64"
        : "仅提供 64 位版本";

  return (
    <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/[0.06] p-5 shadow-[0_0_0_1px_rgba(16,185,129,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10">
            <Icon className="h-4.5 w-4.5 text-emerald-500" />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[15px] font-semibold text-zinc-100">
              {meta.label} · {meta.arch}
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-normal text-emerald-400">
                已识别你的平台
              </span>
            </p>
            <p className="mt-0.5 truncate font-mono text-[12px] text-zinc-400">{asset.name}</p>
          </div>
        </div>
        <Button
          asChild
          className="h-10 shrink-0 bg-emerald-600 px-5 font-mono text-sm text-zinc-950 hover:bg-emerald-500"
        >
          <a href={asset.browser_download_url} target="_blank" rel="noreferrer">
            <Download className="mr-1.5 h-4 w-4" />
            下载 · {fmtSize(asset.size)}
            {asset.download_count > 0 ? ` · ${asset.download_count} 次` : ""}
          </a>
        </Button>
      </div>
      {/* 校验行：有旁车 → 官方 sha256 + 复制；无旁车 → 平台校验命令 + 复制 */}
      <div className="mt-4 border-t border-emerald-500/15 pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`shrink-0 rounded border px-1.5 py-px font-mono text-[11px] ${
              asset.sha256
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-zinc-700 bg-zinc-900 text-zinc-500"
            }`}
          >
            {asset.sha256 ? "✓ sha256" : "verify"}
          </span>
          <code className="scrollbar-thin min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[11.5px] text-zinc-400">
            {asset.sha256 ? shortHash(asset.sha256) : verifyCmd(asset.name, meta.os)}
          </code>
          <CopyButton text={asset.sha256 ?? verifyCmd(asset.name, meta.os)} />
        </div>
        <p className="mt-1.5 font-mono text-[11px] text-zinc-600">
          {asset.sha256
            ? "官方校验和（Release 旁车文件）· 点右侧复制后与本地对比"
            : `下载后${meta.os === "windows" ? "在 PowerShell 执行" : "执行"}以校验完整性 · 复制命令`}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-500/15 pt-3">
        <p className="font-mono text-[11.5px] text-zinc-400">
          <span className="text-emerald-500">install</span> · {INSTALL_HINT}
        </p>
        <p className="font-mono text-[11px] text-zinc-500">
          {meta.note} · {archTip}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 安装命令生成器：选平台 → 生成整段安装脚本 → 一键复制
// 命令 URL 优先取真实 Release 资产；fallback 数据时退到 latest/download 恒定链接
// ---------------------------------------------------------------------------

function InstallGenerator({ assets, detected }: { assets: Asset[]; detected: Target | null }) {
  const [sel, setSel] = useState<Target | null>(null);
  const active: Target = sel ?? detected ?? "bun-linux-x64";
  const asset = assets.find((a) => a.target === active) ?? assets[0];
  if (!asset) return null;
  const meta = TARGET_META[asset.target as Target];
  const url = asset.browser_download_url.endsWith(".zip")
    ? asset.browser_download_url
    : `${LATEST_BASE}/${asset.name}`;
  const cmd = installCmd(asset.target as Target, url, asset.name);
  const lines = cmd.split("\n");
  const isWin = meta.os === "windows";

  return (
    <div className="rounded-xl border border-zinc-800 bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 px-5 py-3.5">
        <span className="flex items-center gap-2.5 font-mono text-[13px] font-semibold text-zinc-100">
          <SquareTerminal className="h-4 w-4 text-emerald-500" />
          安装命令
        </span>
        <span className="font-mono text-[11px] text-zinc-600">
          复制整段 → 粘贴到{isWin ? " PowerShell" : " 终端"} → 回车
        </span>
      </div>

      {/* 平台 tabs（默认选中访问者平台） */}
      <div
        role="tablist"
        aria-label="选择目标平台"
        className="scrollbar-thin flex items-center gap-1.5 overflow-x-auto px-5 pt-3"
      >
        {TARGET_ORDER.map((t) => {
          const m = TARGET_META[t];
          const on = t === active;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setSel(t)}
              className={`shrink-0 rounded-md border px-2.5 py-1.5 font-mono text-[11.5px] transition-colors ${
                on
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              {m.label} · {m.arch}
            </button>
          );
        })}
      </div>

      {/* 命令块 */}
      <div className="px-5 py-4">
        <div className="flex items-start gap-2">
          <pre className="scrollbar-thin min-w-0 flex-1 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-[12px] leading-relaxed">
            {lines.map((line, i) => {
              const isComment = /^\s*(#|\/\/)/.test(line);
              const isRun = i === lines.length - 1;
              return (
                <code key={i} className="block whitespace-pre">
                  <span
                    className={`mr-2 select-none ${isWin ? "text-sky-500/80" : "text-emerald-600/80"}`}
                  >
                    {isWin ? "PS>" : "$"}
                  </span>
                  <span
                    className={
                      isComment
                        ? "text-zinc-600"
                        : isRun
                          ? "font-semibold text-emerald-400"
                          : "text-zinc-300"
                    }
                  >
                    {line}
                  </span>
                </code>
              );
            })}
          </pre>
          <CopyButton text={cmd} className="mt-1" />
        </div>
        <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-zinc-600">
          zip 内为单文件 {isWin ? "org.exe" : "org"} · 启动后即进入组织驾驶舱（TUI）· 对应资产：{" "}
          {asset.name} · {fmtSize(asset.size)}
        </p>
      </div>
    </div>
  );
}

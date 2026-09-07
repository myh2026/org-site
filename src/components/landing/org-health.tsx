"use client";

import { useEffect, useState } from "react";
import type { OrgHealth } from "@/app/api/org-health/route";

// ---------------------------------------------------------------------------
// 工程体检条：hero 左栏最下方的一行「实测元数据」。
// 数据源 /api/org-health（静态实测本机构建工作树，10min 缓存）：
//   v0.4.1 · main@22e46b3 · 30 hsl 模块 · 内核 1203 行 · 3 test files
// 每一段都链到 GitHub 对应页面（tag / commit / tree / blob）——
// 数字可点击溯源，不是文案。仓库缺席时整条隐藏（与 RepoBadges 同策略：
// 宁可空白，不可虚构）。
// ---------------------------------------------------------------------------

const REPO = "https://github.com/myh2026/org";

export function OrgHealth() {
  const [data, setData] = useState<OrgHealth | null>(null);

  useEffect(() => {
    // rAF 延迟一帧：避免 effect 内同步 setState 的水合时序问题（与 download 同法）
    const raf = requestAnimationFrame(() => {
      fetch("/api/org-health")
        .then((r) => r.json())
        .then((d: OrgHealth) => {
          if (d.ok) setData(d);
        })
        .catch(() => {
          /* 静默隐藏：体检条是增强信息，失败不留痕 */
        });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!data) return null;

  const linkCls =
    "transition-colors hover:text-emerald-400 hover:underline underline-offset-2";

  return (
    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] text-zinc-600">
      <span
        className="shrink-0 text-emerald-600"
        title="以下数字实时实测自本机构建工作树（/home/z/org），非文案虚构"
      >
        ✓ 实测
      </span>
      <a
        href={`${REPO}/releases/tag/v${data.version}`}
        target="_blank"
        rel="noreferrer"
        className={linkCls}
        title="package.json version → GitHub Release"
      >
        v{data.version}
      </a>
      <span aria-hidden="true" className="text-zinc-800">
        ·
      </span>
      <a
        href={`${REPO}/commit/${data.commit}`}
        target="_blank"
        rel="noreferrer"
        className={linkCls}
        title={
          data.commitDate
            ? `main 最新提交（${new Date(data.commitDate).toLocaleDateString("zh-CN")}）`
            : "main 最新提交"
        }
      >
        {data.branch}@{data.commit}
      </a>
      <span aria-hidden="true" className="text-zinc-800">
        ·
      </span>
      <a
        href={`${REPO}/tree/main/hsl`}
        target="_blank"
        rel="noreferrer"
        className={linkCls}
        title="hsl/ 目录下 .hsl 模块文件总数（递归）"
      >
        {data.modules} hsl 模块
      </a>
      <span aria-hidden="true" className="text-zinc-800">
        ·
      </span>
      <a
        href={`${REPO}/blob/main/hsl/org.hsl`}
        target="_blank"
        rel="noreferrer"
        className={linkCls}
        title="主控内核 org.hsl 行数（与下方源码区同一口径）"
      >
        内核 {data.kernelLoc.toLocaleString()} 行
      </a>
      {data.testFiles > 0 && (
        <>
          <span aria-hidden="true" className="text-zinc-800">
            ·
          </span>
          <a
            href={`${REPO}/tree/main/tests`}
            target="_blank"
            rel="noreferrer"
            className={linkCls}
            title="tests/ 下机制级测试文件"
          >
            {data.testFiles} test files
          </a>
        </>
      )}
    </p>
  );
}

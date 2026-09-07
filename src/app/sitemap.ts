import type { MetadataRoute } from "next";

// 单页站点 sitemap：仅 / 路由（官网只做下载与介绍）。
// 基准 URL 与 layout metadataBase 同源（NEXT_PUBLIC_SITE_URL 可覆盖）。
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}

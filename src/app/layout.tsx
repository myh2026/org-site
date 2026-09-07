import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "ORG — Organization Harness",
  description:
    "基于 HSL 的组织化多智能体系统。子智能体可生成、可验收、可复用、可演进——成熟流程的单位成本随使用递减。",
  keywords: ["ORG", "HSL", "multi-agent", "agent harness", "subagent", "MCP", "A2A", "org-harness"],
  authors: [{ name: "myh2026" }],
  openGraph: {
    title: "ORG — Organization Harness",
    description:
      "子智能体是工程资产，不是一次性函数。生成过闸门、任务沉淀资产、成本随使用递减。Windows / macOS / Linux 单二进制。",
    url: "/",
    siteName: "ORG",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ORG — Organization Harness",
    description:
      "子智能体是工程资产，不是一次性函数。Windows / macOS / Linux 单二进制，HSL 驱动。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}

import { Nav } from "@/components/landing/nav";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { Hero } from "@/components/landing/hero";
import { Stats, Why, Dynamics, Principles } from "@/components/landing/sections";
import { SourceSection } from "@/components/landing/source";
import { Architecture } from "@/components/landing/architecture-map";
import { TuiShowcase } from "@/components/landing/tui-showcase";
import { ChangelogSection } from "@/components/landing/changelog";
import { ReplaySection } from "@/components/landing/replay";
import { Quickstart } from "@/components/landing/quickstart";
import { FaqSection } from "@/components/landing/faq";
import { FAQS } from "@/components/landing/faq-data";
import { DownloadSection } from "@/components/landing/download";
import { Footer } from "@/components/landing/footer";
import { ScrollTop } from "@/components/landing/scroll-top";
import { CommandPalette } from "@/components/landing/command-palette";
import { KeysOverlay } from "@/components/landing/keys-overlay";

// SoftwareApplication 结构化数据：让搜索引擎正确理解这是免费、跨三平台的
// 开发者工具（rich result：名称/平台/版本/仓库/作者）。与 layout 的
// OG/Twitter 卡互补。
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ORG",
  alternateName: "Organization Harness",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Windows, macOS, Linux",
  softwareVersion: "0.4.1",
  description:
    "基于 HSL 的组织化多智能体系统。子智能体可生成、可验收、可复用、可演进——成熟流程的单位成本随使用递减。",
  url: SITE_URL,
  codeRepository: "https://github.com/myh2026/org",
  downloadUrl: "https://github.com/myh2026/org/releases/latest",
  isAccessibleForFree: true,
  author: { "@type": "Person", name: "myh2026", url: "https://github.com/myh2026" },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

// FAQPage 结构化数据：与 FAQS 共用单一事实源（faq-data），去反引号即纯文本。
// 配合 SoftwareApplication，让搜索引擎以富结果展示问答与产品信息。
const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a.replace(/`/g, "") },
  })),
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // 结构化数据为静态常量，无用户输入注入面
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <Nav />
      <ScrollProgress />
      <main className="flex-1">
        <Hero />
        <Stats />
        <Why />
        <Architecture />
        <Dynamics />
        <ReplaySection />
        <Principles />
        <SourceSection />
        <TuiShowcase />
        <ChangelogSection />
        <Quickstart />
        <FaqSection />
        <DownloadSection />
      </main>
      <Footer />
      <ScrollTop />
      <CommandPalette />
      <KeysOverlay />
    </>
  );
}

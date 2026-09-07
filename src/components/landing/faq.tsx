"use client";

import { ArrowUpRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQS, renderFaqAnswer } from "./faq-data";

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-16 border-t border-zinc-800/80">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        {/* 标题行 */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
          <div>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-500">
              faq
            </p>
            <h2 className="font-mono text-2xl font-semibold tracking-tight text-zinc-100 md:text-3xl">
              常见问题
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
              关于 HSL、单二进制、专家工厂与协议支持的八个高频问题——回答全部对齐仓库文档，不含营销话术。
            </p>
          </div>
          <span className="hidden items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 font-mono text-[12px] text-zinc-500 md:flex">
            <span className="select-none text-emerald-600">$</span> org --faq
          </span>
        </div>

        {/* 手风琴列表 */}
        <div className="rounded-xl border border-zinc-800 bg-card">
          <Accordion type="single" collapsible className="px-5 md:px-6">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`q-${i}`}
                className="border-zinc-800/80 last:border-b-0"
              >
                <AccordionTrigger className="group gap-4 py-5 hover:no-underline [&>svg]:hidden">
                  <span className="flex min-w-0 items-start gap-3.5 text-left">
                    <span className="mt-px shrink-0 font-mono text-[12px] font-normal text-emerald-600 transition-colors group-hover:text-emerald-500 group-data-[state=open]:text-emerald-500">
                      Q{String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[14px] font-medium leading-relaxed text-zinc-200 transition-colors group-hover:text-zinc-50 md:text-[15px]">
                      {f.q}
                    </span>
                  </span>
                  {/* 自绘开合指示：终端风格 +/− */}
                  <span
                    aria-hidden="true"
                    className="relative mt-1.5 h-3 w-3 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400"
                  >
                    <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-current" />
                    <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-current transition-transform duration-200 group-data-[state=open]:scale-y-0" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 pl-[46px] pr-2">
                  <div className="max-w-3xl text-[13.5px] leading-relaxed text-zinc-400 [&_code]:rounded [&_code]:bg-zinc-900 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] [&_code]:text-zinc-300">
                    {renderFaqAnswer(f.a)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* 底部出口 */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[11px] text-zinc-600">
            还有别的疑问？README 的「设计决策」「已知边界」两节覆盖了更多取舍细节。
          </p>
          <a
            href="https://github.com/myh2026/org/blob/main/README.md"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-1.5 font-mono text-[12.5px] text-zinc-400 transition-colors hover:text-emerald-400"
          >
            阅读完整 README
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </section>
  );
}

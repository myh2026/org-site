// 公共小件：小节标题与复制按钮

export function SectionHeading({
  kicker,
  title,
  desc,
}: {
  kicker: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mb-10 md:mb-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-500 mb-3">
        {kicker}
      </p>
      <h2 className="font-mono text-2xl md:text-3xl font-semibold tracking-tight text-zinc-100">
        {title}
      </h2>
      {desc ? (
        <p className="mt-3 max-w-2xl text-sm md:text-base leading-relaxed text-zinc-400">
          {desc}
        </p>
      ) : null}
    </div>
  );
}

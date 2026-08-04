type SectionTitleProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionTitle({ eyebrow, title, description }: SectionTitleProps) {
  return (
    <div className="max-w-3xl space-y-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-navy-300/30 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-navy-100">
        <span className="h-2 w-2 rounded-full bg-navy-300 shadow-[0_0_18px_rgba(240,221,139,0.9)]" />
        {eyebrow}
      </div>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      <p className="text-base leading-7 text-stone-300 sm:text-lg">{description}</p>
    </div>
  );
}
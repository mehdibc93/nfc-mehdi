type FeatureCardProps = {
  title: string;
  description: string;
};

export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="glass group rounded-3xl p-6 transition duration-300 hover:-translate-y-1 hover:border-navy-300/30 hover:bg-white/8">
      <div className="mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-navy-200 to-navy-500 p-[1px] shadow-glow">
        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-black/80 text-lg font-bold text-navy-100">
          ✓
        </div>
      </div>
      <h3 className="mb-3 text-xl font-semibold text-white">{title}</h3>
      <p className="text-sm leading-6 text-stone-300">{description}</p>
    </div>
  );
}
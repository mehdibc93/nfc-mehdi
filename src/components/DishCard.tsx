type DishCardProps = {
  name: string;
  description: string;
  price: string;
  tint: string;
};

export function DishCard({ name, description, price, tint }: DishCardProps) {
  return (
    <div className="glass overflow-hidden rounded-3xl border border-white/10 transition duration-300 hover:-translate-y-1 hover:border-navy-300/25">
      <div className={`h-40 bg-gradient-to-br ${tint} relative p-4`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_35%)]" />
        <div className="absolute bottom-4 left-4 rounded-full border border-white/30 bg-black/25 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          Photo du plat
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-lg font-semibold text-white">{name}</h4>
          <span className="rounded-full bg-navy-300/15 px-3 py-1 text-sm font-bold text-navy-100">
            {price}
          </span>
        </div>
        <p className="text-sm leading-6 text-stone-300">{description}</p>
        <button className="text-sm font-semibold text-navy-100 transition hover:text-navy-300">
          Modifier
        </button>
      </div>
    </div>
  );
}
type PhonePreviewProps = {
  restaurantName: string;
};

export function PhonePreview({ restaurantName }: PhonePreviewProps) {
  return (
    <div className="mx-auto w-full max-w-[360px] rounded-[2.4rem] border border-white/10 bg-black p-3 shadow-[0_28px_90px_rgba(0,0,0,0.62)]">
      <div className="mask-phone border border-white/10 bg-[#0c0c0c]">
        <div className="h-6 bg-gradient-to-r from-black via-stone-900 to-black" />
        <div className="space-y-5 bg-[radial-gradient(circle_at_top,_rgba(60,90,134,0.22),transparent_34%),linear-gradient(180deg,#161616,#090909)] px-5 pb-6 pt-4">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>9:41</span>
            <span>5G • 98%</span>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-500 to-navy-800 text-sm font-black text-white">
                LP
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-navy-100">Restaurant</p>
                <p className="font-display text-xl font-semibold text-white">{restaurantName}</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-stone-300">
              Bienvenue dans notre restaurant. Découvrez nos plats, nos avis et toutes nos
              actualités en un instant.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {['Voir le menu', 'Découvrir nos plats', 'Avis clients', 'Nous trouver'].map((label, index) => (
              <button
                key={label}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-left text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-navy-300/30 hover:bg-white/10"
              >
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-navy-300/15 text-lg text-navy-100">
                  {['🍽', '📸', '⭐', '📍'][index]}
                </span>
                {label}
              </button>
            ))}
          </div>

          <div className="rounded-[1.8rem] border border-navy-300/15 bg-black/45 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-navy-100">Menu digital</p>
                <p className="text-sm text-stone-400">Les favoris du chef</p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-stone-300">
                Live
              </span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Burger Gourmet', price: '21€' },
                { name: 'Risotto aux champignons', price: '23€' },
                { name: 'Fondant chocolat', price: '12€' },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-3">
                  <span className="text-sm text-white">{item.name}</span>
                  <span className="text-sm font-semibold text-navy-100">{item.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
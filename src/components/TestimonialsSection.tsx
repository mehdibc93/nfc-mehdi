import { TESTIMONIALS } from '../lib/testimonials';
import { Reveal } from './Reveal';
import { SectionHeading } from './MarketingBlocks';

// Avis de restaurateurs (src/lib/testimonials.ts). Rien n'est affiché tant que la liste est vide.
// Un avis sans nom ni établissement s'affiche comme « Restaurateur ».

export function TestimonialsSection({
  eyebrow = 'Ils l’ont testé',
  title = 'Ce qu’en disent les restaurateurs',
  className = 'pt-24',
}: {
  eyebrow?: string;
  title?: string;
  className?: string;
}) {
  if (TESTIMONIALS.length === 0) return null;
  const columns =
    TESTIMONIALS.length === 1 ? 'mx-auto max-w-2xl' : TESTIMONIALS.length === 2 ? 'mx-auto max-w-4xl md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3';

  return (
    <section className={`mx-auto w-full max-w-6xl px-4 sm:px-8 lg:px-10 ${className}`}>
      <Reveal>
        <SectionHeading eyebrow={eyebrow} title={title} />
      </Reveal>
      <div className={`mt-10 grid gap-5 ${columns}`}>
        {TESTIMONIALS.map((item, index) => {
          const name = item.name?.trim() || 'Restaurateur';
          const details = [item.role, item.restaurant, item.city].filter(Boolean).join(' · ');
          return (
            <Reveal key={item.quote} delayMs={(index % 3) * 80}>
              <figure className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-stone-200/70 bg-white p-7 shadow-soft">
                <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-6 font-display text-[120px] leading-none text-navy-100">
                  ”
                </span>
                <blockquote className="relative font-display text-xl font-bold leading-snug text-stone-900">« {item.quote} »</blockquote>
                <figcaption className="relative mt-6 flex items-center gap-3 border-t border-stone-100 pt-5">
                  {item.photo ? (
                    <img src={item.photo} alt="" width={48} height={48} loading="lazy" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800 font-display text-lg font-bold text-white"
                    >
                      {item.name?.trim() ? item.name.trim().charAt(0).toUpperCase() : '🍽️'}
                    </span>
                  )}
                  <span>
                    <span className="block font-semibold text-stone-900">{name}</span>
                    {details && <span className="block text-sm text-stone-500">{details}</span>}
                    {item.since && <span className="block text-xs text-stone-400">{item.since}</span>}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

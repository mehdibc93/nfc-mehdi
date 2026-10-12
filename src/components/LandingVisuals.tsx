import logoMark from '../assets/logo-mark.png';

// Visuels de la page d'accueil : vraies captures de l'application dans un cadre de téléphone
// ou de navigateur, et carte NFC illustrée.

// Cadre de téléphone autour d'une vraie capture de la carte client.
export function PhoneFrame({ src, alt, eager = false, className = '' }: { src: string; alt: string; eager?: boolean; className?: string }) {
  return (
    <div className={`rounded-[2.4rem] bg-stone-900 p-2 shadow-card ring-1 ring-black/10 ${className}`}>
      <div className="overflow-hidden rounded-[2rem] bg-white">
        <img
          src={src}
          alt={alt}
          width={780}
          height={1688}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="block h-auto w-full"
        />
      </div>
    </div>
  );
}

// Carte NFC posée sur la table, avec les ondes du « tap ». La largeur est donnée par
// `className` ; `compact` pour les petits formats (texte réduit au strict nécessaire).
export function NfcCard({ className = 'w-full', compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div
      className={`relative aspect-[1.586] rounded-2xl bg-gradient-to-br from-navy-600 via-navy-700 to-navy-900 p-4 text-white shadow-glow ring-1 ring-white/10 sm:p-5 ${className}`}
    >
      <div className="flex items-center gap-2">
        <img src={logoMark} alt="" className={`rounded-md bg-white/90 p-0.5 ${compact ? 'h-5 w-5' : 'h-6 w-6'}`} />
        <span className={`font-bold uppercase ${compact ? 'text-[10px] tracking-[0.2em]' : 'text-xs tracking-[0.3em]'}`}>Nourevo</span>
      </div>
      <div className={compact ? 'absolute right-3 top-3' : 'absolute right-4 top-4 sm:right-5 sm:top-5'} aria-hidden="true">
        <span className="absolute inset-0 rounded-full bg-white/30 motion-safe:animate-ping" />
        <svg viewBox="0 0 24 24" className={`relative ${compact ? 'h-5 w-5' : 'h-7 w-7'}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M8.5 8.5a5 5 0 0 1 0 7" />
          <path d="M11.5 6a8.5 8.5 0 0 1 0 12" />
          <path d="M14.5 3.5a12 12 0 0 1 0 17" />
        </svg>
      </div>
      {compact ? (
        <p className="absolute bottom-3 left-4 right-4 text-xs font-semibold leading-snug">Approchez votre téléphone</p>
      ) : (
        <p className="absolute bottom-4 left-4 right-4 text-sm font-semibold leading-snug sm:bottom-5 sm:left-5 sm:text-base">
          Approchez votre téléphone
          <span className="block text-xs font-normal text-white/70">pour voir le menu et commander</span>
        </p>
      )}
    </div>
  );
}

// Cadre de navigateur autour d'une vraie capture d'un écran restaurateur (dashboard, Mode Service).
export function BrowserFrame({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-card ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-stone-100 bg-stone-50 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <span className="ml-2 truncate rounded-full bg-white px-3 py-0.5 text-[10px] text-stone-400">nourevo.fr/dashboard</span>
      </div>
      <img src={src} alt={alt} width={1920} height={1200} loading="lazy" decoding="async" className="block h-auto w-full" />
    </div>
  );
}

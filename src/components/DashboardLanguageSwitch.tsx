import { useDashboardLocale } from '../lib/dashboardLocale';

// Sélecteur FR / EN pour la langue d'affichage du dashboard restaurateur — placé dans
// l'en-tête de chaque page restaurateur. Le choix est mémorisé (localStorage) et n'est
// jamais imposé : par défaut le dashboard reste en français tant que le restaurateur ne
// choisit pas explicitement l'anglais.
export function DashboardLanguageSwitch() {
  const { locale, setLocale } = useDashboardLocale();

  return (
    <div className="inline-flex items-center rounded-full border border-stone-200 bg-white p-0.5 text-xs font-bold">
      {(['fr', 'en'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLocale(option)}
          aria-pressed={locale === option}
          className={`rounded-full px-2.5 py-1 uppercase tracking-wide transition-all duration-300 ${
            locale === option ? 'bg-navy-700 text-white' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

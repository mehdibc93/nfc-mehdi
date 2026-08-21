import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// Langue d'affichage du DASHBOARD RESTAURATEUR (gestion de la carte, Mode Service,
// statistiques...) — à ne pas confondre avec la langue choisie par le CLIENT sur la carte
// digitale publique (voir src/lib/i18n.ts), qui est un système entièrement séparé.

export type DashboardLocale = 'fr' | 'en';

const STORAGE_KEY = 'nourevo_dashboard_locale';

function readStoredLocale(): DashboardLocale {
  if (typeof window === 'undefined') return 'fr';
  return window.localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'fr';
}

type DashboardLocaleContextValue = {
  locale: DashboardLocale;
  setLocale: (locale: DashboardLocale) => void;
};

const DashboardLocaleContext = createContext<DashboardLocaleContextValue | null>(null);

export function DashboardLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<DashboardLocale>(readStoredLocale);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  return <DashboardLocaleContext.Provider value={{ locale, setLocale }}>{children}</DashboardLocaleContext.Provider>;
}

export function useDashboardLocale() {
  const ctx = useContext(DashboardLocaleContext);
  if (!ctx) throw new Error('useDashboardLocale must be used within a DashboardLocaleProvider');
  return ctx;
}

// `dt('Texte en français', 'English text')` — les deux langues vivent côte à côte dans
// chaque composant plutôt que dans un dictionnaire séparé à maintenir en parallèle : avec
// seulement 2 langues et plusieurs centaines de textes, c'est plus simple à relire et à
// tenir à jour que des clés indirectes (`t('dashboard.save.button')`) éclatées ailleurs.
export function useDt() {
  const { locale } = useDashboardLocale();
  return <T,>(fr: T, en: T): T => (locale === 'en' ? en : fr);
}

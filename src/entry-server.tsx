// Entrée de rendu serveur, utilisée UNIQUEMENT au build par scripts/prerender.mjs pour
// générer le HTML statique des pages publiques. L'arbre rendu doit rester identique à celui
// de main.tsx + App.tsx pour que l'hydratation côté client ne produise aucun écart.
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { Routes, StaticRouter } from 'react-router-dom';
import { DashboardLocaleProvider } from './lib/dashboardLocale';
import { publicRoutes } from './publicRoutes';

export { PUBLIC_PAGES, SHELL_META } from './lib/pageMeta';
export { SITE_URL } from './lib/site';
export { renderHeadTags } from './lib/seo';

export function render(url: string) {
  return renderToString(
    <StrictMode>
      <DashboardLocaleProvider>
        <StaticRouter location={url}>
          <Routes>{publicRoutes}</Routes>
        </StaticRouter>
      </DashboardLocaleProvider>
    </StrictMode>,
  );
}

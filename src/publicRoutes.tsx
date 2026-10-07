import { Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { PricingPage } from './pages/PricingPage';
import { FaqPage } from './pages/FaqPage';
import { DiscoverDashboardPage } from './pages/DiscoverDashboardPage';
import { ContactPage } from './pages/ContactPage';
import { LegalNoticePage } from './pages/LegalNoticePage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';

// Pages publiques, pré-rendues en HTML statique au build (scripts/prerender.mjs) puis
// hydratées côté client. Partagées entre App.tsx et entry-server.tsx pour que le HTML
// pré-rendu et le rendu client restent identiques. Ce module (et donc le rendu serveur)
// n'importe volontairement AUCUNE page privée : dashboard, Mode Service, auth et menus
// /r/:slug restent en SPA classique (Supabase auth, Stripe, model-viewer).
// Chaque chemin doit aussi avoir ses métadonnées dans src/lib/pageMeta.ts.
const PUBLIC_ROUTES = [
  { path: '/', element: <LandingPage /> },
  { path: '/tarifs', element: <PricingPage /> },
  { path: '/faq', element: <FaqPage /> },
  { path: '/decouvrir-dashboard', element: <DiscoverDashboardPage /> },
  { path: '/contact', element: <ContactPage /> },
  { path: '/mentions-legales', element: <LegalNoticePage /> },
  { path: '/cgu', element: <TermsPage /> },
  { path: '/confidentialite', element: <PrivacyPage /> },
];

export const publicRoutes = PUBLIC_ROUTES.map(({ path, element }) => (
  <Route key={path} path={path} element={element} />
));

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DashboardLocaleProvider } from './lib/dashboardLocale';
import './index.css';

const rootElement = document.getElementById('root') as HTMLElement;
const app = (
  <React.StrictMode>
    <DashboardLocaleProvider>
      <App />
    </DashboardLocaleProvider>
  </React.StrictMode>
);

// Pages publiques pré-rendues au build (voir scripts/prerender.mjs) : le HTML est déjà là, on
// l'hydrate. Shell SPA (dashboard, auth, /r/:slug) : #root est vide, rendu client classique.
if (rootElement.firstElementChild) {
  ReactDOM.hydrateRoot(rootElement, app);
} else {
  ReactDOM.createRoot(rootElement).render(app);
}

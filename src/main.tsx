import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DashboardLocaleProvider } from './lib/dashboardLocale';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <DashboardLocaleProvider>
      <App />
    </DashboardLocaleProvider>
  </React.StrictMode>,
);
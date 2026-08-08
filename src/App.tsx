import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabaseClient';
import { LoadingScreen } from './components/LoadingScreen';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { StatsPage } from './pages/StatsPage';
import { ServicePage } from './pages/ServicePage';
import { ProfitabilityPage } from './pages/ProfitabilityPage';
import { ConfigurationPage } from './pages/ConfigurationPage';
import { RestaurantExperience } from './pages/RestaurantExperience';
import { LegalNoticePage } from './pages/LegalNoticePage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { ContactPage } from './pages/ContactPage';
import { PricingPage } from './pages/PricingPage';
import { FaqPage } from './pages/FaqPage';
import { DiscoverDashboardPage } from './pages/DiscoverDashboardPage';

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />;
  }

  return <>{children}</>;
}

// Bloque l'accès aux pages restaurateur (Mode Service, stats, rentabilité, configuration) tant
// que l'abonnement n'est pas actif — DashboardPage.tsx affiche déjà l'écran de paiement/
// réactivation, donc on y redirige plutôt que de dupliquer cet écran ici.
function RequireActiveSubscription({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'active' | 'inactive'>('loading');

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    supabase
      .from('restaurants')
      .select('subscription_status')
      .eq('owner_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setStatus(data?.subscription_status === 'active' ? 'active' : 'inactive');
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'inactive') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/inscription" element={<SignupPage />} />
        <Route path="/reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/carte"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/restaurant"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/paiements"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/stats"
          element={
            <RequireAuth>
              <RequireActiveSubscription>
                <StatsPage />
              </RequireActiveSubscription>
            </RequireAuth>
          }
        />
        <Route
          path="/service"
          element={
            <RequireAuth>
              <RequireActiveSubscription>
                <ServicePage />
              </RequireActiveSubscription>
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/rentabilite"
          element={
            <RequireAuth>
              <RequireActiveSubscription>
                <ProfitabilityPage />
              </RequireActiveSubscription>
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/configuration"
          element={
            <RequireAuth>
              <RequireActiveSubscription>
                <ConfigurationPage />
              </RequireActiveSubscription>
            </RequireAuth>
          }
        />
        <Route path="/r/:slug" element={<RestaurantExperience />} />
        <Route path="/mentions-legales" element={<LegalNoticePage />} />
        <Route path="/cgu" element={<TermsPage />} />
        <Route path="/confidentialite" element={<PrivacyPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/tarifs" element={<PricingPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/decouvrir-dashboard" element={<DiscoverDashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

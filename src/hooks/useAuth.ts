import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  // Le lien de l'email de confirmation ramène sur le domaine d'où l'on s'inscrit (nourevo.fr en
  // production), directement au dashboard : la session est récupérée depuis l'URL au chargement.
  // Ce domaine doit figurer dans Authentication > URL Configuration > Redirect URLs (Supabase).
  const confirmationRedirect = () => `${window.location.origin}/dashboard`;

  const signUp = (email: string, password: string) =>
    supabase.auth.signUp({ email, password, options: { emailRedirectTo: confirmationRedirect() } });

  const resendConfirmation = (email: string) =>
    supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: confirmationRedirect() } });

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signOut = () => supabase.auth.signOut();

  const sendPasswordReset = (email: string) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
    });

  const updatePassword = (password: string) => supabase.auth.updateUser({ password });

  return {
    session,
    user: session?.user as User | undefined,
    loading,
    isAuthenticated: Boolean(session),
    signUp,
    resendConfirmation,
    signIn,
    signOut,
    sendPasswordReset,
    updatePassword,
  };
}

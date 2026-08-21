import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logoHorizontal from '../assets/logo-horizontal.png';
import { setPageMeta } from '../lib/seo';
import { DashboardLanguageSwitch } from '../components/DashboardLanguageSwitch';
import { useDt } from '../lib/dashboardLocale';

export function LoginPage() {
  const dt = useDt();
  const { signIn, sendPasswordReset } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setPageMeta({
      title: 'Connexion restaurateur — Nourevo',
      description: 'Connectez-vous à votre dashboard Nourevo pour gérer votre carte, vos commandes et votre restaurant.',
    });
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);
    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? dt('Email ou mot de passe incorrect.', 'Incorrect email or password.')
          : signInError.message,
      );
      return;
    }
    navigate('/dashboard');
  };

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetError('');
    setResetSubmitting(true);
    const { error: resetErr } = await sendPasswordReset(resetEmail);
    setResetSubmitting(false);
    if (resetErr) {
      setResetError(resetErr.message);
      return;
    }
    setResetSent(true);
  };

  if (mode === 'forgot') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-14">
        <div className="mb-4 flex w-full max-w-sm items-center justify-between gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition-colors duration-300 hover:text-navy-700"
          >
            {dt("← Retour à l'accueil", '← Back to home')}
          </Link>
          <DashboardLanguageSwitch />
        </div>
        <div className="w-full max-w-sm rounded-3xl border border-stone-200/70 bg-white p-8 shadow-soft">
          <img src={logoHorizontal} alt="Nourevo" className="h-7 w-auto" />
          <h1 className="mt-3 font-display text-2xl font-bold text-stone-900">{dt('Mot de passe oublié', 'Forgot password')}</h1>

          {resetSent ? (
            <>
              <p className="mt-2 text-sm text-stone-500">
                {dt('Si un compte existe pour', 'If an account exists for')} <strong>{resetEmail}</strong>{' '}
                {dt("un email avec un lien de réinitialisation vient d'être envoyé. Pensez à vérifier vos spams.", 'an email with a reset link has just been sent. Remember to check your spam folder.')}
              </p>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setResetSent(false);
                }}
                className="mt-6 w-full rounded-full border border-stone-200 bg-white px-5 py-3.5 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40"
              >
                {dt('Retour à la connexion', 'Back to login')}
              </button>
            </>
          ) : (
            <form onSubmit={handleResetSubmit}>
              <p className="mt-2 text-sm text-stone-500">
                {dt('Entrez votre email, on vous envoie un lien pour choisir un nouveau mot de passe.', "Enter your email, we'll send you a link to choose a new password.")}
              </p>
              <label className="mt-6 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                {dt('Email', 'Email')}
                <input
                  type="email"
                  required
                  autoFocus
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none transition-colors duration-300 focus:border-navy-300"
                />
              </label>

              {resetError && <p className="mt-3 text-sm font-semibold text-red-500">{resetError}</p>}

              <button
                type="submit"
                disabled={resetSubmitting}
                className="mt-6 w-full rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-3.5 text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 disabled:opacity-60"
              >
                {resetSubmitting ? dt('Envoi...', 'Sending...') : dt('Envoyer le lien', 'Send the link')}
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="mt-3 w-full rounded-full border border-stone-200 bg-white px-5 py-3.5 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40"
              >
                {dt('Retour à la connexion', 'Back to login')}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-14">
      <div className="mb-4 flex w-full max-w-sm items-center justify-between gap-3">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition-colors duration-300 hover:text-navy-700"
        >
          {dt("← Retour à l'accueil", '← Back to home')}
        </Link>
        <DashboardLanguageSwitch />
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-3xl border border-stone-200/70 bg-white p-8 shadow-soft">
        <img src={logoHorizontal} alt="Nourevo" className="h-7 w-auto" />
        <h1 className="mt-3 font-display text-2xl font-bold text-stone-900">{dt('Connexion restaurateur', 'Restaurant owner login')}</h1>
        <p className="mt-2 text-sm text-stone-500">{dt('Accédez à la gestion de votre carte.', 'Access your menu management.')}</p>

        <label className="mt-6 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
          {dt('Email', 'Email')}
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none transition-colors duration-300 focus:border-navy-300"
          />
        </label>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
          {dt('Mot de passe', 'Password')}
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none transition-colors duration-300 focus:border-navy-300"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setResetEmail(email);
            setMode('forgot');
          }}
          className="mt-2 text-xs font-semibold text-stone-400 underline hover:text-navy-700"
        >
          {dt('Mot de passe oublié ?', 'Forgot password?')}
        </button>

        {error && <p className="mt-3 text-sm font-semibold text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-3.5 text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 disabled:opacity-60"
        >
          {submitting ? dt('Connexion...', 'Logging in...') : dt('Se connecter', 'Log in')}
        </button>

        <p className="mt-5 text-center text-sm text-stone-500">
          {dt('Pas encore de compte ?', 'No account yet?')}{' '}
          <Link to="/inscription" className="font-semibold text-navy-700">
            {dt('Créer un compte', 'Create an account')}
          </Link>
        </p>
      </form>
    </div>
  );
}

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logoHorizontal from '../assets/logo-horizontal.png';
import { setPageMeta } from '../lib/seo';
import { DashboardLanguageSwitch } from '../components/DashboardLanguageSwitch';
import { useDt } from '../lib/dashboardLocale';

export function SignupPage() {
  const dt = useDt();
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setPageMeta({
      title: 'Créer mon compte restaurateur — Nourevo',
      description: 'Créez votre compte Nourevo et composez votre carte digitale en quelques minutes.',
    });
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(dt('Le mot de passe doit contenir au moins 6 caractères.', 'The password must be at least 6 characters long.'));
      return;
    }
    setSubmitting(true);
    const { data, error: signUpError } = await signUp(email, password);
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      navigate('/dashboard');
      return;
    }
    // Confirmation email requise avant de pouvoir se connecter (réglage par défaut de Supabase Auth)
    setConfirmationSent(true);
  };

  if (confirmationSent) {
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
        <div className="w-full max-w-sm rounded-3xl border border-stone-200/70 bg-white p-8 text-center shadow-soft">
          <h1 className="font-display text-2xl font-bold text-stone-900">{dt('Vérifiez votre email', 'Check your email')}</h1>
          <p className="mt-3 text-sm text-stone-500">
            {dt('Un email de confirmation a été envoyé à', 'A confirmation email has been sent to')}{' '}
            <span className="font-semibold text-stone-700">{email}</span>.{' '}
            {dt('Cliquez sur le lien reçu puis connectez-vous.', 'Click the link you received, then log in.')}
          </p>
          <Link
            to="/connexion"
            className="mt-6 inline-block w-full rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-3.5 text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5"
          >
            {dt('Aller à la connexion', 'Go to login')}
          </Link>
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
        <h1 className="mt-3 font-display text-2xl font-bold text-stone-900">{dt('Créer mon compte', 'Create my account')}</h1>
        <p className="mt-2 text-sm text-stone-500">{dt('Créez votre carte digitale en quelques minutes.', 'Create your digital menu in minutes.')}</p>

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
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none transition-colors duration-300 focus:border-navy-300"
          />
        </label>

        {error && <p className="mt-3 text-sm font-semibold text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-3.5 text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 disabled:opacity-60"
        >
          {submitting ? dt('Création...', 'Creating...') : dt('Créer mon compte', 'Create my account')}
        </button>

        <p className="mt-5 text-center text-sm text-stone-500">
          {dt('Déjà un compte ?', 'Already have an account?')}{' '}
          <Link to="/connexion" className="font-semibold text-navy-700">
            {dt('Se connecter', 'Log in')}
          </Link>
        </p>
      </form>
    </div>
  );
}

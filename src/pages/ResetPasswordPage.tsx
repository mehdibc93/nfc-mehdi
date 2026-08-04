import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logoHorizontal from '../assets/logo-horizontal.png';

export function ResetPasswordPage() {
  const { session, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setSubmitting(true);
    const { error: updateError } = await updatePassword(password);
    setSubmitting(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-14">
      <Link
        to="/"
        className="mb-4 flex w-full max-w-sm items-center gap-1.5 text-sm font-semibold text-stone-500 transition-colors duration-300 hover:text-navy-700"
      >
        ← Retour à l'accueil
      </Link>
      <div className="w-full max-w-sm rounded-3xl border border-stone-200/70 bg-white p-8 shadow-soft">
        <img src={logoHorizontal} alt="Nourevo" className="h-7 w-auto" />
        <h1 className="mt-3 font-display text-2xl font-bold text-stone-900">Nouveau mot de passe</h1>

        {loading ? (
          <p className="mt-4 text-sm text-stone-500">Vérification du lien...</p>
        ) : done ? (
          <>
            <p className="mt-2 text-sm text-stone-500">
              Votre mot de passe a été mis à jour. Vous pouvez maintenant accéder à votre dashboard.
            </p>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-3.5 text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5"
            >
              Aller à mon dashboard
            </button>
          </>
        ) : !session ? (
          <>
            <p className="mt-2 text-sm text-stone-500">
              Ce lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau depuis la page de
              connexion.
            </p>
            <Link
              to="/connexion"
              className="mt-6 block w-full rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-3.5 text-center text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5"
            >
              Retour à la connexion
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="mt-2 text-sm text-stone-500">Choisissez votre nouveau mot de passe.</p>
            <label className="mt-6 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
              Nouveau mot de passe
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none transition-colors duration-300 focus:border-navy-300"
              />
            </label>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
              Confirmer le mot de passe
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none transition-colors duration-300 focus:border-navy-300"
              />
            </label>

            {error && <p className="mt-3 text-sm font-semibold text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-3.5 text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 disabled:opacity-60"
            >
              {submitting ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

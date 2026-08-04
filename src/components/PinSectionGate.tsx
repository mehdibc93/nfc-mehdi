import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { isSectionLocked, verifyPin } from '../lib/staffMode';
import type { StaffSection } from '../lib/staffMode';

type GatedRestaurant = {
  pinProtectedSections: string[];
  servicePin: string | null;
};

export function PinSectionGate({
  restaurant,
  section,
  children,
}: {
  restaurant: GatedRestaurant;
  section: StaffSection;
  children: ReactNode;
}) {
  const [unlocked, setUnlocked] = useState(() => !isSectionLocked(restaurant, section));
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  const handleValidate = () => {
    if (verifyPin(restaurant, pin)) {
      setUnlocked(true);
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-14">
      <div className="w-full max-w-xs rounded-3xl border border-stone-200/70 bg-white p-8 text-center shadow-soft">
        <p className="text-3xl">🔒</p>
        <h1 className="mt-3 font-display text-lg font-bold text-stone-900">Accès protégé</h1>
        <p className="mt-2 text-sm text-stone-500">Entrez le code à 4 chiffres pour accéder à cette page.</p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          autoFocus
          value={pin}
          onChange={(event) => {
            setError(false);
            setPin(event.target.value.replace(/\D/g, '').slice(0, 4));
          }}
          onKeyDown={(event) => event.key === 'Enter' && handleValidate()}
          className={`mt-5 w-full rounded-2xl border bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none transition-colors duration-300 ${
            error ? 'border-red-400' : 'border-stone-200 focus:border-navy-300'
          }`}
          placeholder="••••"
        />
        {error && <p className="mt-2 text-xs font-semibold text-red-500">Code incorrect.</p>}
        <button
          type="button"
          onClick={handleValidate}
          disabled={pin.length !== 4}
          className="mt-5 w-full rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-4 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
        >
          Valider
        </button>
        <Link to="/" className="mt-4 block text-xs font-semibold text-stone-400 hover:text-stone-600">
          ← Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}

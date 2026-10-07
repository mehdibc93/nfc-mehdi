import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logoHorizontal from '../assets/logo-horizontal.png';
import { setPublicPageMeta } from '../lib/seo';
import { useAuth } from '../hooks/useAuth';
import { FAQ_ITEMS } from '../lib/faq';

export function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setPublicPageMeta('/faq');
  }, []);

  return (
    <div className="min-h-screen px-4 py-14 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition-colors duration-300 hover:text-navy-700"
        >
          ← Retour à l'accueil
        </Link>

        <img src={logoHorizontal} alt="Nourevo" className="h-8 w-auto" />
        <h1 className="mt-4 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
          Questions fréquentes
        </h1>
        <p className="mt-3 text-base leading-7 text-stone-500">
          Vous ne trouvez pas votre réponse ?{' '}
          <Link to="/contact" className="font-semibold text-navy-700 underline">
            Contactez-nous directement
          </Link>
          .
        </p>

        <div className="mt-10 space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question} className="rounded-3xl border border-stone-200/70 bg-white shadow-soft">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-display text-base font-bold text-stone-900">{item.question}</span>
                  <span className={`shrink-0 text-navy-700 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                {/* Toujours dans le DOM (masqué si fermé) : les réponses restent lisibles par
                    les moteurs de recherche et les IA dans le HTML pré-rendu. */}
                <p id={`faq-answer-${index}`} hidden={!isOpen} className="px-6 pb-5 text-sm leading-6 text-stone-500">
                  {item.answer}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 p-8 text-center shadow-glow sm:p-10">
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
            Prêt à essayer Nourevo ?
          </h2>
          <p className="max-w-md text-sm text-white/80">
            Créez votre compte et composez votre carte en quelques minutes.
          </p>
          <Link
            to={isAuthenticated ? '/dashboard' : '/inscription'}
            className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-navy-800 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
          >
            {isAuthenticated ? 'Aller à mon dashboard' : 'Créer mon compte'}
          </Link>
        </div>
      </div>
    </div>
  );
}

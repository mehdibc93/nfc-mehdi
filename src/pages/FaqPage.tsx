import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logoHorizontal from '../assets/logo-horizontal.png';
import { setPageMeta } from '../lib/seo';

const FAQ_ITEMS = [
  {
    question: 'Comment mes clients paient-ils leur commande ?',
    answer:
      'Par carte bancaire, Apple Pay ou Google Pay directement depuis leur téléphone, via Stripe — ou en payant à la caisse comme d\'habitude, si vous préférez. L\'argent arrive directement sur votre propre compte bancaire, Nourevo ne prélève aucune commission sur vos ventes.',
  },
  {
    question: 'Ai-je besoin d\'un matériel spécial ?',
    answer:
      'Non, la carte NFC à poser sur chaque table est fournie par nos soins avec votre abonnement, déjà configurée pour votre restaurant. Vous n\'avez rien à acheter ni à programmer vous-même.',
  },
  {
    question: 'Est-ce compatible avec tous les téléphones ?',
    answer:
      'Pour programmer la carte NFC : oui sur Android (directement depuis Chrome), et sur iPhone via une application gratuite comme NFC Tools (limitation d\'Apple, pas de Nourevo). Côté client, scanner la carte et commander fonctionne sur tous les smartphones.',
  },
  {
    question: 'Y a-t-il un engagement ?',
    answer:
      'Le plan à 59€/mois est sans engagement, résiliable à tout moment. Les plans à 54€/mois et 588€/an impliquent un engagement de 12 mois, en échange d\'un tarif réduit.',
  },
  {
    question: 'Puis-je gérer mon menu dans plusieurs langues ?',
    answer:
      'Oui, votre carte peut être traduite en français, anglais, espagnol, chinois et russe, avec une traduction automatique en un clic depuis le dashboard.',
  },
  {
    question: 'Puis-je voir un exemple avant de créer un compte ?',
    answer:
      'Oui, une carte de démonstration complète est accessible depuis la page d\'accueil ("Voir la démo « Le Jardin Parisien »"), sans avoir besoin de créer de compte.',
  },
  {
    question: 'Que se passe-t-il si un plat n\'est plus disponible ?',
    answer:
      'Vous pouvez suivre le stock de chaque plat individuellement — dès qu\'il atteint zéro, il disparaît automatiquement de la carte, sans action de votre part. Vous pouvez aussi marquer un plat "Rupture de stock" manuellement à tout moment.',
  },
  {
    question: 'Mes données et celles de mes clients sont-elles protégées ?',
    answer:
      'Oui. Consultez notre politique de confidentialité pour le détail du traitement des données. Les paiements sont gérés directement par Stripe, Nourevo n\'a jamais accès aux coordonnées bancaires de vos clients.',
  },
  {
    question: 'Puis-je annuler mon abonnement à tout moment ?',
    answer:
      'Oui, depuis votre espace de gestion d\'abonnement (portail Stripe accessible depuis le dashboard). Pour les plans avec engagement de 12 mois, l\'annulation prend effet à la fin de la période engagée.',
  },
];

export function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    setPageMeta({
      title: 'FAQ — Nourevo',
      description: 'Les réponses aux questions les plus fréquentes sur Nourevo : paiement, matériel NFC, abonnement, langues, sécurité.',
    });
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
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-display text-base font-bold text-stone-900">{item.question}</span>
                  <span className={`shrink-0 text-navy-700 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                {isOpen && (
                  <p className="px-6 pb-5 text-sm leading-6 text-stone-500">{item.answer}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

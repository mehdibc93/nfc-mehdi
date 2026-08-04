import { Link } from 'react-router-dom';
import logoHorizontal from '../assets/logo-horizontal.png';

export function TermsPage() {
  return (
    <div className="min-h-screen px-4 py-14">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition-colors duration-300 hover:text-navy-700"
        >
          ← Retour à l'accueil
        </Link>

        <div className="rounded-3xl border border-stone-200/70 bg-white p-8 shadow-soft sm:p-10">
          <img src={logoHorizontal} alt="Nourevo" className="h-7 w-auto" />
          <h1 className="mt-3 font-display text-3xl font-bold text-stone-900">
            Conditions générales d'utilisation
          </h1>
          <p className="mt-2 text-sm text-stone-400">Dernière mise à jour : à compléter avant publication.</p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-stone-600">
            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">1. Objet</h2>
              <p className="mt-2">
                Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation de la
                plateforme Nourevo par les restaurateurs ("l'Utilisateur"), qui permet de créer et gérer une
                carte digitale accessible via une carte NFC, de recevoir des commandes, et d'encaisser des paiements
                en ligne via un compte Stripe Connect propre à l'Utilisateur.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">2. Création de compte</h2>
              <p className="mt-2">
                L'inscription nécessite une adresse email valide. L'Utilisateur est responsable de la confidentialité
                de ses identifiants et de l'exactitude des informations qu'il renseigne (nom du restaurant, adresse,
                composition de la carte, prix). Un seul restaurant est géré par compte.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">3. Paiements et Stripe Connect</h2>
              <p className="mt-2">
                Pour encaisser des paiements en ligne (carte, Apple Pay, Google Pay), l'Utilisateur doit connecter un
                compte Stripe Express en son nom propre. Les fonds versés par les clients sont crédités directement
                sur ce compte Stripe, sans transiter par Nourevo, et sans commission prélevée par
                Nourevo sur ces transactions. L'utilisation de Stripe est par ailleurs soumise aux
                conditions générales de Stripe (stripe.com/fr/legal), que l'Utilisateur accepte séparément lors de la
                connexion de son compte. Nourevo n'intervient à aucun moment dans la détention des fonds.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">4. Tarifs</h2>
              <p className="mt-2">
                L'accès à la plateforme est proposé selon trois formules au choix :
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li><strong>59€ HT/mois</strong> — sans engagement, résiliable à tout moment depuis le dashboard ;</li>
                <li>
                  <strong>49€ HT/mois</strong> — avec un engagement initial de 12 mois, facturé mensuellement sur
                  toute la durée de l'engagement ;
                </li>
                <li><strong>588€ HT/an</strong> — engagement de 12 mois, facturé en une seule fois.</li>
              </ul>
              <p className="mt-2">
                [À confirmer : régime de TVA applicable selon le statut juridique de l'éditeur.] Les frais de
                traitement des paiements appliqués par Stripe sur les transactions clients restent à la charge de
                l'Utilisateur et s'ajoutent à cet abonnement.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">5. Obligations de l'Utilisateur</h2>
              <p className="mt-2">
                L'Utilisateur s'engage à publier des informations exactes sur sa carte (prix, allergènes,
                disponibilité des plats) et à traiter les commandes reçues via la plateforme. Nourevo ne
                garantit pas l'exactitude des informations publiées par l'Utilisateur et n'intervient pas dans la
                relation commerciale entre l'Utilisateur et ses clients.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">6. Disponibilité du service</h2>
              <p className="mt-2">
                Nourevo met en œuvre des moyens raisonnables pour assurer la disponibilité du service, sans
                garantie de continuité absolue. Des interruptions pour maintenance peuvent survenir.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">7. Résiliation</h2>
              <p className="mt-2">
                L'Utilisateur peut cesser d'utiliser le service à tout moment. Nourevo se réserve le droit
                de suspendre ou résilier un compte en cas de manquement grave aux présentes CGU.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">8. Responsabilité</h2>
              <p className="mt-2">
                Nourevo fournit un outil technique et ne saurait être tenu responsable des litiges entre
                l'Utilisateur et ses clients, ni des conséquences d'informations erronées publiées par l'Utilisateur
                sur sa carte.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">9. Droit applicable</h2>
              <p className="mt-2">
                Les présentes CGU sont soumises au droit français. Tout litige relève, à défaut de résolution
                amiable, des juridictions compétentes.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">10. Contact</h2>
              <p className="mt-2">Pour toute question : contact.nourevo@gmail.com.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

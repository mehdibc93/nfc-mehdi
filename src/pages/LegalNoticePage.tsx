import { Link } from 'react-router-dom';
import logoHorizontal from '../assets/logo-horizontal.png';

export function LegalNoticePage() {
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
          <h1 className="mt-3 font-display text-3xl font-bold text-stone-900">Mentions légales</h1>
          <p className="mt-2 text-sm text-stone-400">Dernière mise à jour : à compléter avant publication.</p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-stone-600">
            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">1. Éditeur du site</h2>
              <p className="mt-2">
                Le site Nourevo est édité par :
                <br />
                [Nom, prénom] — Entrepreneur individuel (auto-entrepreneur)
                <br />
                [Adresse postale complète]
                <br />
                Numéro SIRET : [à compléter après immatriculation URSSAF]
                <br />
                Email de contact : contact.nourevo@gmail.com
                <br />
                Directeur de la publication : [Nom, prénom]
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">2. Hébergement</h2>
              <p className="mt-2">
                <strong>Hébergement du site (frontend)</strong> : [Nom de l'hébergeur, ex. Vercel Inc. / Netlify Inc.],
                [adresse de l'hébergeur].
                <br />
                <strong>Hébergement des données (base de données, authentification, stockage)</strong> : Supabase Inc.,
                970 Toa Payoh North #07-04, Singapore 318992.
                <br />
                <strong>Traitement des paiements</strong> : Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower,
                Grand Canal Dock, Dublin, Irlande.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">3. Propriété intellectuelle</h2>
              <p className="mt-2">
                L'ensemble des éléments du site Nourevo (textes, design, logo, structure) est protégé par le
                droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite. Les contenus
                propres à chaque restaurant (nom, plats, photos, descriptions) restent la propriété du restaurateur
                qui les publie.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">4. Responsabilité</h2>
              <p className="mt-2">
                Nourevo fournit un outil technique permettant aux restaurateurs de publier leur carte et de
                recevoir des commandes/paiements. Les informations publiées sur chaque carte (plats, prix,
                allergènes, disponibilité) relèvent de la seule responsabilité du restaurateur qui les renseigne.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">5. Contact</h2>
              <p className="mt-2">Pour toute question relative au site : contact.nourevo@gmail.com.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

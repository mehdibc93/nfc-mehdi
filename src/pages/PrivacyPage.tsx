import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoHorizontal from '../assets/logo-horizontal.png';
import { setPageMeta } from '../lib/seo';

export function PrivacyPage() {
  useEffect(() => {
    setPageMeta({
      title: 'Politique de confidentialité — Nourevo',
      description: 'Politique de confidentialité et protection des données personnelles sur Nourevo.',
    });
  }, []);

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
          <h1 className="mt-3 font-display text-3xl font-bold text-stone-900">Politique de confidentialité</h1>
          <p className="mt-2 text-sm text-stone-400">Dernière mise à jour : à compléter avant publication.</p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-stone-600">
            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">1. Responsable du traitement</h2>
              <p className="mt-2">
                [Nom, prénom], éditeur de Nourevo (voir{' '}
                <Link to="/mentions-legales" className="font-semibold text-navy-700 underline">
                  mentions légales
                </Link>
                ), est responsable du traitement des données décrites ci-dessous.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">2. Données collectées</h2>
              <p className="mt-2">
                <strong>Restaurateurs (comptes créés)</strong> : adresse email, mot de passe (stocké de façon
                chiffrée, jamais en clair), nom et adresse du restaurant, photos et contenu de la carte, identifiant
                du compte Stripe Connect une fois connecté (nous ne stockons ni ne voyons jamais votre IBAN ou vos
                données bancaires, gérées exclusivement par Stripe).
                <br />
                <br />
                <strong>Clients des restaurants (aucun compte requis)</strong> : lors de la consultation d'une carte
                ou d'une commande, sont enregistrés le contenu de la commande, le numéro de table indiqué, et des
                statistiques d'usage anonymes (vues de plats, ajouts au panier) rattachées au restaurant concerné —
                aucune donnée d'identité (nom, email) n'est demandée au client pour consulter le menu ou passer
                commande. En cas de paiement par carte, les données bancaires sont saisies directement dans
                l'interface sécurisée de Stripe et ne transitent jamais par nos serveurs.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">3. Finalités</h2>
              <p className="mt-2">
                Ces données sont utilisées pour : permettre la création et la gestion d'un compte restaurateur,
                afficher la carte digitale aux clients, transmettre les commandes au restaurant (y compris via le
                Mode Service en temps réel), traiter les paiements via Stripe, et fournir au restaurateur des
                statistiques d'usage de sa carte.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">4. Destinataires des données</h2>
              <p className="mt-2">
                Les données sont hébergées et traitées par nos sous-traitants techniques :
                <br />— <strong>Supabase Inc.</strong> (base de données, authentification, stockage des photos) ;
                <br />— <strong>Stripe Payments Europe, Ltd.</strong> (traitement des paiements et données bancaires,
                lorsque le paiement en ligne est utilisé).
                <br />
                Ces prestataires peuvent impliquer un transfert de données hors de l'Union européenne ; ils
                s'engagent contractuellement à respecter des garanties de protection des données équivalentes au
                RGPD (clauses contractuelles types).
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">5. Durée de conservation</h2>
              <p className="mt-2">
                Les données d'un compte restaurateur sont conservées tant que le compte est actif, puis supprimées
                dans un délai raisonnable après suppression du compte. Les données de commande sont conservées le
                temps nécessaire à leur traitement et aux obligations comptables applicables.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">6. Cookies et stockage local</h2>
              <p className="mt-2">
                Le site utilise uniquement des mécanismes techniques nécessaires au fonctionnement (session de
                connexion, contenu du panier en cours) — aucun cookie publicitaire ou de traçage tiers n'est déposé.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">7. Vos droits</h2>
              <p className="mt-2">
                Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation
                et de portabilité de vos données, ainsi que d'un droit d'opposition. Pour l'exercer, contactez :
                contact.nourevo@gmail.com. Vous disposez également du droit d'introduire une réclamation auprès de
                la CNIL (cnil.fr).
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">8. Sécurité</h2>
              <p className="mt-2">
                L'accès aux données est protégé par des règles de sécurité au niveau de la base de données (chaque
                restaurateur ne peut accéder qu'à ses propres données), un chiffrement des échanges (HTTPS), et
                aucune donnée bancaire n'est stockée sur nos serveurs.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-stone-900">9. Contact</h2>
              <p className="mt-2">Pour toute question relative à vos données : contact.nourevo@gmail.com.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

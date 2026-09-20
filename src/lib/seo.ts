// Met à jour le titre de l'onglet + les balises meta (description, canonical, robots, Open
// Graph, Twitter Card, JSON-LD) pour la page courante. Utile pour le référencement (chaque
// page a un titre/description propres, une URL canonique, et des données structurées quand
// c'est pertinent) et pour l'aperçu affiché quand un lien est partagé (WhatsApp, réseaux
// sociaux). Pas de dépendance ajoutée (pas de react-helmet) — manipulation directe du <head>.

type PageMeta = {
  title: string;
  description: string;
  image?: string;
  /** Chemin canonique (ex: "/tarifs"). Par défaut, l'URL courante sans paramètres de requête
   * (`?demo=1`, etc.) — pour éviter que Google indexe plusieurs variantes d'une même page. */
  canonicalPath?: string;
  /** Pages privées (connexion, dashboard...) : jamais indexées ni suivies. */
  noindex?: boolean;
  /** Un ou plusieurs objets Schema.org (Organization, FAQPage, Restaurant...) à injecter en
   * JSON-LD. Remplace toute donnée structurée précédemment injectée par cet appel. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', 'canonical');
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

function upsertJsonLd(data: Record<string, unknown> | Record<string, unknown>[] | undefined) {
  const existing = document.getElementById('page-jsonld');
  if (!data) {
    existing?.remove();
    return;
  }
  const script = existing instanceof HTMLScriptElement ? existing : document.createElement('script');
  script.id = 'page-jsonld';
  script.type = 'application/ld+json';
  if (!existing) document.head.appendChild(script);
  script.textContent = JSON.stringify(data);
}

export function setPageMeta({ title, description, image, canonicalPath, noindex, jsonLd }: PageMeta) {
  document.title = title;
  upsertMeta('name', 'description', description);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:url', window.location.href);
  upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  if (image) {
    upsertMeta('property', 'og:image', image);
    upsertMeta('name', 'twitter:image', image);
  }

  const canonicalHref = canonicalPath
    ? `${window.location.origin}${canonicalPath}`
    : `${window.location.origin}${window.location.pathname}`;
  upsertCanonical(canonicalHref);

  upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

  upsertJsonLd(jsonLd);
}

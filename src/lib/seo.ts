// Met à jour le titre de l'onglet + les balises meta (description, Open Graph, Twitter Card)
// pour la page courante. Utile pour le référencement (chaque page a un titre/description
// propres) et pour l'aperçu affiché quand un lien est partagé (WhatsApp, réseaux sociaux).
// Pas de dépendance ajoutée (pas de react-helmet) — manipulation directe du <head>, restaurée
// par le composant appelant lors du démontage si besoin.

type PageMeta = {
  title: string;
  description: string;
  image?: string;
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

export function setPageMeta({ title, description, image }: PageMeta) {
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
}

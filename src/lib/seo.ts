// Balises <head> de chaque page : titre, description, canonical, robots, Open Graph, Twitter
// Card et JSON-LD. Deux usages qui produisent EXACTEMENT les mêmes balises :
// - renderHeadTags() : chaîne HTML injectée au build dans les pages publiques pré-rendues
//   (scripts/prerender.mjs), lisible par les moteurs de recherche et les IA sans JavaScript ;
// - setPageMeta() : met à jour ces balises lors d'une navigation côté client.
// Pas de dépendance ajoutée (pas de react-helmet) — manipulation directe du <head>.
import { getPublicPageMeta } from './pageMeta';
import type { JsonLd } from './pageMeta';
import { DEFAULT_OG_IMAGE, SITE_URL } from './site';

type PageMeta = {
  title: string;
  description: string;
  image?: string;
  /** Chemin canonique (ex: "/tarifs"). Par défaut, le chemin courant sans paramètres de requête
   * (`?demo=1`, etc.) — pour éviter que Google indexe plusieurs variantes d'une même page. */
  canonicalPath?: string;
  /** Pages privées (connexion, dashboard, menus /r/:slug...) : jamais indexées ni suivies. */
  noindex?: boolean;
  /** Un ou plusieurs objets Schema.org (Organization, FAQPage, Restaurant...) à injecter en
   * JSON-LD. Remplace toute donnée structurée précédemment injectée par cet appel. */
  jsonLd?: JsonLd;
};

type HeadTag =
  | { kind: 'meta'; attr: 'name' | 'property'; key: string; content: string }
  | { kind: 'canonical'; href: string };

function buildHeadTags({ title, description, image, canonicalPath, noindex }: PageMeta, path: string): HeadTag[] {
  const url = `${SITE_URL}${canonicalPath ?? path}`;
  const meta = (attr: 'name' | 'property', key: string, content: string): HeadTag => ({ kind: 'meta', attr, key, content });
  return [
    meta('name', 'description', description),
    meta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow'),
    // Pas de canonical sur une page noindex : les deux signaux seraient contradictoires.
    ...(noindex ? [] : [{ kind: 'canonical', href: url } as HeadTag]),
    meta('property', 'og:title', title),
    meta('property', 'og:description', description),
    meta('property', 'og:type', 'website'),
    meta('property', 'og:url', url),
    meta('property', 'og:image', image || DEFAULT_OG_IMAGE),
    meta('property', 'og:site_name', 'Nourevo'),
    meta('property', 'og:locale', 'fr_FR'),
    meta('name', 'twitter:card', image ? 'summary_large_image' : 'summary'),
    meta('name', 'twitter:title', title),
    meta('name', 'twitter:description', description),
    meta('name', 'twitter:image', image || DEFAULT_OG_IMAGE),
  ];
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// `<` échappé pour qu'un texte contenant "</script>" ne puisse pas fermer la balise.
function serializeJsonLd(data: JsonLd) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** Balises <head> sous forme de HTML, pour le pré-rendu au build (pas d'accès au DOM). */
export function renderHeadTags(meta: PageMeta & { path?: string }) {
  const tags = buildHeadTags(meta, meta.path ?? '/').map((tag) =>
    tag.kind === 'canonical'
      ? `<link rel="canonical" href="${escapeHtml(tag.href)}" />`
      : `<meta ${tag.attr}="${tag.key}" content="${escapeHtml(tag.content)}" />`,
  );
  const lines = [`<title>${escapeHtml(meta.title)}</title>`, ...tags];
  if (meta.jsonLd) {
    lines.push(`<script type="application/ld+json" id="page-jsonld">${serializeJsonLd(meta.jsonLd)}</script>`);
  }
  return lines.join('\n\t\t');
}

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

function upsertJsonLd(data: JsonLd | undefined) {
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

export function setPageMeta(meta: PageMeta) {
  if (typeof document === 'undefined') return;
  document.title = meta.title;
  if (meta.noindex) document.head.querySelector('link[rel="canonical"]')?.remove();
  for (const tag of buildHeadTags(meta, window.location.pathname)) {
    if (tag.kind === 'canonical') upsertCanonical(tag.href);
    else upsertMeta(tag.attr, tag.key, tag.content);
  }
  upsertJsonLd(meta.jsonLd);
}

/** Pages publiques : mêmes balises que celles pré-rendues dans leur HTML (src/lib/pageMeta.ts). */
export function setPublicPageMeta(path: string) {
  const meta = getPublicPageMeta(path);
  setPageMeta({ ...meta, canonicalPath: meta.path });
}

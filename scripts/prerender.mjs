// Pré-rendu des pages publiques, lancé par `npm run build` après les builds client et SSR.
// Génère dans dist/ :
// - une page HTML statique par page publique (index.html, tarifs.html, faq.html...), avec son
//   contenu et ses balises SEO, hydratée ensuite côté client par main.tsx ;
// - app.html : shell SPA vide (noindex) servi par vercel.json pour le dashboard, l'auth et
//   les menus /r/:slug ; 404.html : même shell, servi par Vercel pour les URLs inconnues ;
// - sitemap.xml et robots.txt, construits à partir de SITE_URL (src/lib/site.ts).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const ssrDir = path.join(root, 'dist-ssr');

const { render, renderHeadTags, PUBLIC_PAGES, SHELL_META, SITE_URL } = await import(
  pathToFileURL(path.join(ssrDir, 'entry-server.js')).href
);

const template = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
for (const placeholder of ['<!--app-head-->', '<!--app-html-->']) {
  if (!template.includes(placeholder)) throw new Error(`Placeholder ${placeholder} absent de dist/index.html`);
}

// Fonctions de remplacement (et non chaînes) : le HTML rendu peut contenir des "$" que
// String.replace interpréterait comme des motifs spéciaux.
const fill = (head, html) =>
  template.replace('<!--app-head-->', () => head).replace('<!--app-html-->', () => html);

const fileForPath = (pagePath) => (pagePath === '/' ? 'index.html' : `${pagePath.slice(1)}.html`);

for (const page of PUBLIC_PAGES) {
  const html = fill(renderHeadTags({ ...page, canonicalPath: page.path }), render(page.path));
  const file = path.join(distDir, fileForPath(page.path));
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, html);
  console.log(`  pré-rendu  ${page.path.padEnd(22)} -> dist/${fileForPath(page.path)}`);
}

const shell = fill(renderHeadTags(SHELL_META), '');
await fs.writeFile(path.join(distDir, 'app.html'), shell);
await fs.writeFile(path.join(distDir, '404.html'), shell);
console.log('  shell SPA  dist/app.html, dist/404.html');

const lastmod = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PUBLIC_PAGES.map(
  (page) => `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority.toFixed(1)}</priority>
  </url>`,
).join('\n')}
</urlset>
`;
await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemap);

const robots = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /service
Disallow: /connexion
Disallow: /inscription
Disallow: /reinitialiser-mot-de-passe
Disallow: /app.html

Sitemap: ${SITE_URL}/sitemap.xml
`;
await fs.writeFile(path.join(distDir, 'robots.txt'), robots);
console.log(`  SEO        dist/sitemap.xml, dist/robots.txt (SITE_URL = ${SITE_URL})`);

await fs.rm(ssrDir, { recursive: true, force: true });
// Le client Supabase importé par les pages peut laisser des timers actifs sous Node.
process.exit(0);

#!/usr/bin/env node
/**
 * Générateur statique « Rien (ou presque) » — zéro dépendance.
 * Usage : node build.mjs   → génère le site dans ./docs
 *
 * Contenu : src/pages/*.html (front matter JSON entre deux lignes ---json / ---)
 * Données : src/data/*.json   Gabarit : src/lib/layout.mjs   Actifs : src/assets/*
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { renderPage, renderLadder, renderSigma, renderFaq, formatCitation } from './src/lib/layout.mjs';
import { buildJsonLd } from './src/lib/jsonld.mjs';
import { typo, stripTags, escapeHtml, escapeAttr, wikiUrl } from './src/lib/util.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'docs');

const site = JSON.parse(readFileSync(join(SRC, 'site.json'), 'utf8'));
const sources = JSON.parse(readFileSync(join(SRC, 'data/sources.json'), 'utf8'));
const glossary = JSON.parse(readFileSync(join(SRC, 'data/glossaire.json'), 'utf8'));
const ladder = JSON.parse(readFileSync(join(SRC, 'data/echelle.json'), 'utf8'));

const sourceById = Object.fromEntries(sources.map((s) => [s.id, s]));
const glossById = Object.fromEntries(glossary.map((g) => [g.id, g]));
const BASE = site.base;
const ORIGIN = site.origin;
const abs = (p = '') => ORIGIN + BASE + p;
const rel = (slug) => BASE + (slug ? slug + '/' : '');

/* ---------- 1. Nettoyage + actifs (avec empreinte pour le cache) ---------- */
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'assets'), { recursive: true });

const assetHash = {};
for (const f of readdirSync(join(SRC, 'assets'))) {
  const buf = readFileSync(join(SRC, 'assets', f));
  assetHash[f] = createHash('sha256').update(buf).digest('hex').slice(0, 10);
  copyFileSync(join(SRC, 'assets', f), join(OUT, 'assets', f));
}
const asset = (f) => `${BASE}assets/${f}?v=${assetHash[f] || '0'}`;

/* ---------- 2. Lecture des pages ---------- */
function parsePage(file) {
  const raw = readFileSync(join(SRC, 'pages', file), 'utf8');
  const m = raw.match(/^---json\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!m) throw new Error(`Front matter manquant : ${file}`);
  const fm = JSON.parse(m[1]);
  return { ...fm, file, body: m[2] };
}
const pages = readdirSync(join(SRC, 'pages'))
  .filter((f) => f.endsWith('.html'))
  .map(parsePage)
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
const pageBySlug = Object.fromEntries(pages.map((p) => [p.slug, p]));

/* ---------- 3. Shortcodes ---------- */
function processBody(page) {
  const cites = []; // ordre de première apparition
  const citeNum = (id) => {
    if (!sourceById[id]) throw new Error(`Source inconnue « ${id} » dans ${page.file}`);
    let i = cites.indexOf(id);
    if (i === -1) { cites.push(id); i = cites.length - 1; }
    return i + 1;
  };
  let html = page.body;

  html = html.replace(/\{\{base\}\}/g, BASE);
  html = html.replace(/\{\{echelle(?::(mini))?\}\}/g, (_, mode) => renderLadder(ladder, { mode, rel, asset }));
  html = html.replace(/\{\{sigma\}\}/g, () => renderSigma());
  html = html.replace(/\{\{faq\}\}/g, () => renderFaq(page.faq || []));
  html = html.replace(/\{\{lvl:(\d)(?:\|([^}]+))?\}\}/g, (_, n, label) =>
    `<a class="lvl" data-lvl="${n}" href="${rel('echelle')}#niveau-${n}" title="${escapeAttr(ladder[n].name)}">${label || 'niveau ' + n}</a>`);
  html = html.replace(/\{\{link:([a-z0-9-]*)(?:#([a-z0-9-]+))?\|([^}]+)\}\}/g, (_, slug, hash, label) => {
    if (slug && !pageBySlug[slug]) throw new Error(`Lien interne cassé « ${slug} » dans ${page.file}`);
    return `<a href="${rel(slug)}${hash ? '#' + hash : ''}">${label}</a>`;
  });
  html = html.replace(/\{\{g:([a-z0-9-]+)(?:\|([^}]+))?\}\}/g, (_, id, label) => {
    const g = glossById[id];
    if (!g) throw new Error(`Terme de glossaire inconnu « ${id} » dans ${page.file}`);
    return `<a class="gloss" href="${rel('glossaire')}#${id}" title="${escapeAttr(stripTags(g.def))}">${label || g.term.toLowerCase()}</a>`;
  });
  html = html.replace(/\{\{cite:([a-z0-9_,\s-]+)\}\}/g, (_, ids) => {
    const nums = ids.split(',').map((s) => s.trim()).filter(Boolean).map((id) => [id, citeNum(id)]);
    return `<sup class="cite">${nums.map(([id, n]) => `<a href="#src-${id}" aria-label="Source ${n}">${n}</a>`).join('<span aria-hidden="true">,</span>')}</sup>`;
  });

  // Sommaire à partir des <h2 id="…">
  const toc = [...html.matchAll(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => ({ id: m[1], text: stripTags(m[2]) }));
  const words = stripTags(html).split(/\s+/).filter(Boolean).length;
  return { html: typo(html), cites, toc, words };
}

/* ---------- 4. Pages générées à partir des données ---------- */
function glossaryBody() {
  const sorted = [...glossary].sort((a, b) => a.term.localeCompare(b.term, 'fr'));
  const initial = (g) => g.term[0].toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const letters = [...new Set(sorted.map(initial))];
  return `
<nav class="alpha" aria-label="Lettres">${letters.map((l) => `<a href="#lettre-${l}">${l}</a>`).join('')}</nav>
<div class="glossary">
${letters.map((L) => `<section aria-labelledby="lettre-${L}">
  <h2 id="lettre-${L}" class="letter">${L}</h2>
  <dl>
${sorted.filter((g) => initial(g) === L).map((g) => `    <div class="term" id="${g.id}">
      <dt><dfn>${escapeHtml(g.term)}</dfn></dt>
      <dd>${g.def}${g.wiki ? ` <a class="wiki" href="${wikiUrl(g.wiki)}" rel="noopener" hreflang="${g.wiki.startsWith('en:') ? 'en' : 'fr'}">Wikipédia${g.wiki.startsWith('en:') ? ' (en anglais)' : ''}</a>` : ''}</dd>
    </div>`).join('\n')}
  </dl>
</section>`).join('\n')}
</div>`;
}

function sourcesBody() {
  const groups = [...new Set(sources.map((s) => s.group))];
  return groups.map((grp) => {
    const id = grp.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const list = sources.filter((s) => s.group === grp).sort((a, b) => a.authors.localeCompare(b.authors, 'fr'));
    return `<h2 id="${id}">${escapeHtml(grp)}</h2>
<ul class="biblio">
${list.map((s) => `  <li id="${s.id}">${formatCitation(s)}</li>`).join('\n')}
</ul>`;
  }).join('\n');
}

/* ---------- 5. Rendu ---------- */
const navPages = site.nav.map((n) => pageBySlug[n.slug]).filter(Boolean);
const rendered = [];

for (const page of pages) {
  if (page.generate === 'glossaire') page.body += glossaryBody();
  if (page.generate === 'sources') page.body += sourcesBody();

  const { html, cites, toc, words } = processBody(page);
  const idx = navPages.indexOf(page);
  const prev = idx > 0 ? navPages[idx - 1] : null;
  const next = idx >= 0 && idx < navPages.length - 1 ? navPages[idx + 1] : null;
  const url = abs(page.slug ? page.slug + '/' : '');
  const citeSources = cites.map((id) => sourceById[id]);

  const jsonld = buildJsonLd({ site, page, url, abs, rel, citeSources, glossary, ladder, sources, pages, wordCount: words });

  const out = typo(renderPage({
    site, page, html, toc, cites: citeSources, words, url, rel, asset, abs, prev, next, jsonld,
  }));
  if (page.slug === '404') {
    // GitHub Pages sert /404.html à la racine pour toute URL inconnue
    writeFileSync(join(OUT, '404.html'), out);
  } else {
    const dir = page.slug ? join(OUT, page.slug) : OUT;
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), out);
  }
  rendered.push({ page, url, words });
}

/* ---------- 6. Fichiers annexes ---------- */
const listed = rendered.filter((r) => r.page.slug !== '404');
const lastmod = (p) => p.dateModified || site.datePublished;

writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${listed.map(({ page, url }) => `  <url><loc>${url}</loc><lastmod>${lastmod(page)}</lastmod><priority>${page.slug === '' ? '1.0' : page.priority || '0.8'}</priority></url>`).join('\n')}
</urlset>
`);

writeFileSync(join(OUT, 'robots.txt'), `# ${site.name}
User-agent: *
Allow: /

Sitemap: ${abs('sitemap.xml')}
`);

const xml = (s) => escapeHtml(s);
writeFileSync(join(OUT, 'feed.xml'), `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="fr">
  <title>${xml(site.name)}</title>
  <subtitle>${xml(site.tagline)}</subtitle>
  <link href="${abs('feed.xml')}" rel="self"/>
  <link href="${abs()}"/>
  <id>${abs()}</id>
  <updated>${new Date(Math.max(...listed.map(({ page }) => +new Date(lastmod(page))))).toISOString()}</updated>
  <author><name>${xml(site.author.name)}</name></author>
  <rights>${xml(site.license.name)}</rights>
${listed.filter(({ page }) => page.inFeed !== false).map(({ page, url }) => `  <entry>
    <title>${xml(page.title)}</title>
    <link href="${url}"/>
    <id>${url}</id>
    <published>${new Date(page.datePublished || site.datePublished).toISOString()}</published>
    <updated>${new Date(lastmod(page)).toISOString()}</updated>
    <summary>${xml(page.description)}</summary>
  </entry>`).join('\n')}
</feed>
`);

writeFileSync(join(OUT, 'manifest.webmanifest'), JSON.stringify({
  name: site.name,
  short_name: 'Rien',
  description: site.description,
  lang: 'fr',
  start_url: BASE,
  scope: BASE,
  display: 'standalone',
  background_color: site.themeColor,
  theme_color: site.themeColor,
  icons: [
    { src: `${BASE}assets/favicon.svg`, sizes: 'any', type: 'image/svg+xml' },
    { src: `${BASE}assets/icon-192.png`, sizes: '192x192', type: 'image/png' },
    { src: `${BASE}assets/icon-512.png`, sizes: '512x512', type: 'image/png' },
  ],
}, null, 2));

writeFileSync(join(OUT, 'llms.txt'), `# ${site.name}

> ${site.description}

Site statique en français. Textes rédigés par ${site.author.name} (${site.author.description}) Licence : ${site.license.name}.

## Pages
${listed.map(({ page, url }) => `- [${page.title}](${url}) : ${page.description}`).join('\n')}
`);

writeFileSync(join(OUT, 'humans.txt'), `/* TEXTES */
Rédaction : ${site.author.name} — ${site.author.description}
Édition : anonyme

/* SITE */
Dernière mise à jour : ${site.datePublished}
Langue : français
Standards : HTML5, CSS, JSON-LD (schema.org), Atom
Composants : générateur maison sans dépendance (Node.js), aucun traceur, aucune requête tierce
`);

writeFileSync(join(OUT, '.nojekyll'), '');
if (existsSync(join(SRC, 'CNAME'))) copyFileSync(join(SRC, 'CNAME'), join(OUT, 'CNAME'));

console.log(`✓ ${rendered.length} pages générées dans docs/ (${listed.reduce((a, r) => a + r.words, 0).toLocaleString('fr-FR')} mots)`);

// Gabarits HTML
import { escapeHtml, escapeAttr, frDate, typo } from './util.mjs';

export const LOGO = (id = 'g') => `<svg class="enso" viewBox="0 0 64 64" width="36" height="36" aria-hidden="true" focusable="false">
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--green)"/><stop offset="1" stop-color="var(--lilac)"/></linearGradient></defs>
  <circle cx="32" cy="32" r="24" fill="none" stroke="url(#${id})" stroke-width="5" stroke-linecap="round" pathLength="100" stroke-dasharray="93 7" transform="rotate(-62 32 32)"/>
  <circle cx="32" cy="32" r="3.2" fill="var(--lilac)"/>
</svg>`;

const LEVEL_NAMES = ['Indubitable', 'Démontré', 'Exact par définition', 'Vérifié à l’extrême', 'Établi', 'Solide', 'Hypothèse dominante', 'Question ouverte', 'Fragile'];

export function renderMeter(levels, rel) {
  if (!levels) return '';
  const [a, b] = levels;
  const txt = a === b ? `niveau ${a}` : `niveaux ${a} à ${b}`;
  return `<div class="meter">
  <span class="meter-label" id="meter-label">Certitude abordée</span>
  <ol class="meter-track" aria-labelledby="meter-label">
    ${LEVEL_NAMES.map((n, i) => `<li class="seg${i >= a && i <= b ? ' on' : ''}" data-lvl="${i}"><span class="sr-only">${i >= a && i <= b ? 'Abordé : ' : ''}niveau ${i}, ${escapeHtml(n)}</span></li>`).join('')}
  </ol>
  <a class="meter-link" href="${rel('echelle')}">${txt} sur l'échelle</a>
</div>`;
}

export function renderLadder(ladder, { mode, rel }) {
  if (mode === 'mini') {
    return `<ol class="ladder-mini" start="0">
${ladder.map((l) => `  <li data-lvl="${l.n}"><a href="${rel('echelle')}#niveau-${l.n}"><span class="rung-n" aria-hidden="true">${l.n}</span><span class="rung-t"><strong>${escapeHtml(l.name)}</strong><span>${escapeHtml(l.short)}</span></span></a></li>`).join('\n')}
</ol>`;
  }
  return `<ol class="ladder" start="0">
${ladder.map((l) => `  <li class="rung" id="niveau-${l.n}" data-lvl="${l.n}">
    <div class="rung-n" aria-hidden="true">${l.n}</div>
    <div class="rung-body">
      <h3><span class="sr-only">Niveau ${l.n} : </span>${escapeHtml(l.name)}</h3>
      <p class="rung-short">${escapeHtml(l.short)}</p>
      <p>${l.what}</p>
      <p class="rung-ex"><strong>Exemples</strong> ${l.examples.map((e) => `<span class="chip">${escapeHtml(e)}</span>`).join(' ')}</p>
      <p class="rung-doubt"><strong>Douter, ici, voudrait dire…</strong> ${l.doubt}</p>
      <a class="more" href="${rel(l.link)}">Approfondir <span aria-hidden="true">→</span></a>
    </div>
  </li>`).join('\n')}
</ol>`;
}

const SIGMA = [
  [1, '0,159', '6'], [1.5, '0,0668', '15'], [2, '0,0228', '44'], [2.5, '0,00621', '161'],
  [3, '0,00135', '741'], [3.5, '0,000233', '4 299'], [4, '3,2 × 10⁻⁵', '31 574'], [4.5, '3,4 × 10⁻⁶', '294 319'],
  [5, '2,9 × 10⁻⁷', '3,5 millions'], [5.5, '1,9 × 10⁻⁸', '53 millions'], [6, '9,9 × 10⁻¹⁰', '1 milliard'],
  [6.5, '4,0 × 10⁻¹¹', '25 milliards'], [7, '1,3 × 10⁻¹²', '781 milliards'],
];
export function renderSigma() {
  const idx5 = SIGMA.findIndex((r) => r[0] === 5);
  return `<figure class="sigma" id="sigma-widget">
  <div class="sigma-ctrl" hidden>
    <div class="sigma-head"><label for="sigma-range">Nombre de sigmas</label> <output id="sigma-out" for="sigma-range">5</output> σ</div>
    <input type="range" id="sigma-range" min="0" max="${SIGMA.length - 1}" step="1" value="${idx5}" aria-describedby="sigma-read">
    <p class="sigma-read" id="sigma-read" aria-live="polite"></p>
  </div>
  <table class="sigma-table">
    <caption>Probabilité qu'une simple fluctuation du hasard produise un signal au moins aussi fort (test unilatéral)</caption>
    <thead><tr><th scope="col">Seuil</th><th scope="col">Probabilité</th><th scope="col">1 chance sur…</th></tr></thead>
    <tbody>
${SIGMA.map(([s, p, n], i) => `      <tr data-i="${i}"${s === 5 ? ' class="hl"' : ''}><th scope="row">${String(s).replace('.', ',')} σ</th><td>${p}</td><td>${n}</td></tr>`).join('\n')}
    </tbody>
  </table>
  <figcaption>Attention : ce chiffre ne dit <em>pas</em> la probabilité que la découverte soit fausse. Il ne mesure que le risque de hasard pur — pas les erreurs systématiques (un câble mal branché, de la poussière cosmique…), ni la plausibilité de l'hypothèse.</figcaption>
</figure>`;
}

export function renderFaq(faq) {
  return `<div class="faq">
${faq.map((f, i) => `  <details id="q${i + 1}"${i === 0 ? ' open' : ''}>
    <summary>${escapeHtml(f.q)}</summary>
    <div class="a"><p>${f.a}</p></div>
  </details>`).join('\n')}
</div>`;
}

export function formatCitation(s) {
  const link = s.doi
    ? ` <a href="https://doi.org/${s.doi}" rel="noopener">doi:${escapeHtml(s.doi)}</a>`
    : s.url ? ` <a href="${escapeAttr(s.url)}" rel="noopener">${escapeHtml(new URL(s.url).hostname.replace(/^www\./, ''))}</a>` : '';
  return typo(`<span class="c-auth">${escapeHtml(s.authors)}</span> (${s.year}). « <span class="c-title">${escapeHtml(s.title)}</span> ». <cite>${escapeHtml(s.container || '')}</cite>.${link}`);
}

function breadcrumb(page, rel) {
  if (!page.slug || page.slug === '404') return '';
  return `<nav class="crumbs" aria-label="Fil d'Ariane"><ol><li><a href="${rel('')}">Accueil</a></li><li aria-current="page">${escapeHtml(page.navLabel || page.title)}</li></ol></nav>`;
}

export function renderPage({ site, page, html, toc, cites, words, url, rel, asset, abs, prev, next, jsonld }) {
  const base = page.seoTitle || page.title;
  const title = (base + ' — ' + site.name).length <= 66 ? `${base} — ${site.name}` : base;
  const minutes = Math.max(1, Math.round(words / 220));
  const modified = page.dateModified || site.datePublished;
  const ogImg = abs(`assets/og-${page.slug || 'accueil'}.png`);
  const nav = site.nav.map((n) => `<li><a href="${rel(n.slug)}"${n.slug === page.slug ? ' aria-current="page"' : ''}>${escapeHtml(n.label)}</a></li>`).join('');
  const showToc = page.toc !== false && toc.length > 2;

  return `<!DOCTYPE html>
<html lang="${site.lang}" data-theme="dark" prefix="og: https://ogp.me/ns#">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeAttr(page.description)}">
${page.slug === '404' ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">`}
<meta name="author" content="${escapeAttr(site.author.name)} (IA, ${escapeAttr(site.author.affiliation.name)})">
${page.keywords ? `<meta name="keywords" content="${escapeAttr(page.keywords.join(', '))}">` : ''}
<meta name="color-scheme" content="dark light">
<meta name="theme-color" content="${site.themeColor}">
<link rel="icon" href="${asset('favicon.svg')}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${asset('apple-touch-icon.png')}">
<link rel="manifest" href="${site.base}manifest.webmanifest">
<link rel="alternate" type="application/atom+xml" title="${escapeAttr(site.name)}" href="${site.base}feed.xml">
<link rel="license" href="${site.license.url}">
<link rel="stylesheet" href="${asset('style.css')}">
<meta property="og:type" content="${page.slug === '' ? 'website' : 'article'}">
<meta property="og:site_name" content="${escapeAttr(site.name)}">
<meta property="og:locale" content="${site.locale}">
<meta property="og:title" content="${escapeAttr(page.seoTitle || page.title)}">
<meta property="og:description" content="${escapeAttr(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeAttr(page.title)} — ${escapeAttr(site.name)}">
${page.slug !== '' ? `<meta property="article:published_time" content="${page.datePublished || site.datePublished}">
<meta property="article:modified_time" content="${modified}">
<meta property="article:author" content="${escapeAttr(site.author.name)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeAttr(page.seoTitle || page.title)}">
<meta name="twitter:description" content="${escapeAttr(page.description)}">
<meta name="twitter:image" content="${ogImg}">
<script>try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}document.documentElement.classList.add('js')</script>
<script type="application/ld+json">
${JSON.stringify(jsonld, null, 1).replace(/</g, '\\u003c')}
</script>
</head>
<body class="p-${page.slug || 'accueil'}">
<a class="skip" href="#contenu">Aller au contenu</a>
<div class="halo" aria-hidden="true"></div>
<header class="site-header">
  <div class="wrap header-in">
    <a class="brand" href="${rel('')}" aria-label="${escapeAttr(site.name)} — accueil">${LOGO('lg-h')}<span class="brand-t"><span class="brand-n">Rien</span><span class="brand-s">(ou presque)</span></span></a>
    <nav class="main-nav" aria-label="Navigation principale"><ul>${nav}</ul></nav>
    <button class="theme-btn" type="button" aria-pressed="false" title="Basculer le thème clair / sombre"><span class="sr-only">Thème clair</span><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path class="moon" d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><g class="sun" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></g></svg></button>
  </div>
</header>

<main id="contenu" tabindex="-1">
<article class="page">
  <header class="hero wrap">
    ${breadcrumb(page, rel)}
    ${page.kicker ? `<p class="kicker">${escapeHtml(page.kicker)}</p>` : ''}
    <h1>${typo(page.h1 || escapeHtml(page.title))}</h1>
    ${page.lead ? `<p class="lead">${typo(page.lead)}</p>` : ''}
    ${page.slug !== '404' ? `<p class="byline">Texte : <a href="${rel('a-propos')}#auteur" rel="author">${escapeHtml(site.author.name)}</a> <span class="muted">(IA)</span> · <span>Mis à jour le <time datetime="${modified}">${frDate(modified)}</time></span> · <span>${minutes} min de lecture</span></p>` : ''}
    ${renderMeter(page.levels, rel)}
  </header>

  <div class="wrap layout${showToc ? ' has-toc' : ''}">
    ${showToc ? `<aside class="toc" aria-labelledby="toc-t">
      <p class="toc-t" id="toc-t">Sur cette page</p>
      <nav aria-labelledby="toc-t"><ol>${toc.map((t) => `<li><a href="#${t.id}">${escapeHtml(t.text)}</a></li>`).join('')}${cites.length ? '<li><a href="#sources-page">Sources</a></li>' : ''}</ol></nav>
    </aside>` : ''}
    <div class="prose">
${html}
${cites.length ? `<section class="page-sources" aria-labelledby="sources-page">
  <h2 id="sources-page">Sources de cette page</h2>
  <ol>
${cites.map((s) => `    <li id="src-${s.id}">${formatCitation(s)}</li>`).join('\n')}
  </ol>
  <p class="all-src"><a href="${rel('sources')}">Toutes les sources du site</a></p>
</section>` : ''}
    </div>
  </div>

  ${prev || next ? `<nav class="wrap pager" aria-label="Pages précédente et suivante">
    ${prev ? `<a class="prev" href="${rel(prev.slug)}" rel="prev"><span class="dir">← Précédent</span><span class="t">${escapeHtml(prev.navLabel || prev.title)}</span></a>` : '<span></span>'}
    ${next ? `<a class="next" href="${rel(next.slug)}" rel="next"><span class="dir">Suivant →</span><span class="t">${escapeHtml(next.navLabel || next.title)}</span></a>` : '<span></span>'}
  </nav>` : ''}
</article>
</main>

<footer class="site-footer">
  <div class="wrap footer-in">
    <div class="f-brand">
      <a class="brand" href="${rel('')}">${LOGO('lg-f')}<span class="brand-t"><span class="brand-n">Rien</span><span class="brand-s">(ou presque)</span></span></a>
      <p>${typo(escapeHtml(site.tagline))}</p>
    </div>
    <nav class="f-nav" aria-label="Pied de page">
      <ul>${site.nav.concat(site.footerNav).map((n) => `<li><a href="${rel(n.slug)}">${escapeHtml(n.label)}</a></li>`).join('')}<li><a href="${site.base}feed.xml">Flux Atom</a></li></ul>
    </nav>
    <div class="f-sign" id="signature">
      <p>${typo(`Textes rédigés par <strong>${escapeHtml(site.author.name)}</strong>, une intelligence artificielle conçue par ${escapeHtml(site.author.affiliation.name)}, à la demande d'un éditeur qui a choisi de rester anonyme. Une IA peut se tromper : chaque affirmation importante renvoie à sa source. <a href="${site.repo}/issues">Signaler une erreur</a>.`)}</p>
      <p class="muted">${typo(`Contenu sous licence <a rel="license" href="${site.license.url}">${site.license.name}</a>. Aucun cookie, aucun traceur, aucune ressource tierce.`)}</p>
    </div>
  </div>
</footer>
<script src="${asset('app.js')}" defer></script>
</body>
</html>
`;
}

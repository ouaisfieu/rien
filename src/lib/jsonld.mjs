// Graphe JSON-LD (schema.org) par page
import { stripTags, wikiUrl } from './util.mjs';

const citationNode = (s) => {
  const n = {
    '@type': s.type || 'CreativeWork',
    name: s.title,
    author: s.authors,
    datePublished: String(s.year),
  };
  if (s.container) n.isPartOf = s.container;
  if (s.doi) {
    n.identifier = { '@type': 'PropertyValue', propertyID: 'DOI', value: s.doi };
    n.url = `https://doi.org/${s.doi}`;
  } else if (s.url) n.url = s.url;
  return n;
};

export function buildJsonLd({ site, page, url, abs, rel, citeSources, glossary, ladder, sources, pages, wordCount }) {
  const SITE = abs() + '#site';
  const AUTHOR = abs('a-propos/') + '#auteur';
  const PAGE = url + '#page';
  const modified = page.dateModified || site.datePublished;
  const published = page.datePublished || site.datePublished;
  const image = abs(`assets/og-${page.slug || 'accueil'}.png`);

  const graph = [
    {
      '@type': 'WebSite',
      '@id': SITE,
      url: abs(),
      name: site.name,
      alternateName: site.tagline,
      description: site.description,
      inLanguage: 'fr',
      creator: { '@id': AUTHOR },
      license: site.license.url,
    },
    {
      '@type': 'Person',
      '@id': AUTHOR,
      name: site.author.name,
      description: site.author.description,
      affiliation: { '@type': 'Organization', name: site.author.affiliation.name, url: site.author.affiliation.url },
      url: abs('a-propos/') + '#auteur',
    },
  ];

  const crumbs = page.slug && page.slug !== '404' ? {
    '@type': 'BreadcrumbList',
    '@id': url + '#fil',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: abs() },
      { '@type': 'ListItem', position: 2, name: page.navLabel || page.title, item: url },
    ],
  } : null;
  if (crumbs) graph.push(crumbs);

  const about = (page.about || []).map((a) => ({ '@type': 'Thing', name: a.name, sameAs: wikiUrl(a.wiki) }));

  const webPage = {
    '@type': page.pageType || 'WebPage',
    '@id': PAGE,
    url,
    name: page.seoTitle || page.title,
    description: page.description,
    inLanguage: 'fr',
    isPartOf: { '@id': SITE },
    primaryImageOfPage: { '@type': 'ImageObject', url: image, width: 1200, height: 630 },
    datePublished: published,
    dateModified: modified,
  };
  if (crumbs) webPage.breadcrumb = { '@id': crumbs['@id'] };
  graph.push(webPage);

  if (page.slug !== '404') {
    const article = {
      '@type': page.articleType || 'Article',
      '@id': url + '#article',
      mainEntityOfPage: { '@id': PAGE },
      headline: (page.seoTitle || page.title).slice(0, 110),
      description: page.description,
      inLanguage: 'fr',
      author: { '@id': AUTHOR },
      publisher: { '@id': AUTHOR },
      datePublished: published,
      dateModified: modified,
      image,
      wordCount,
      isAccessibleForFree: true,
      license: site.license.url,
      audience: { '@type': 'Audience', audienceType: 'Grand public' },
      educationalLevel: 'Grand public curieux, sans prérequis',
      isPartOf: { '@id': SITE },
    };
    if (about.length) article.about = about;
    if (page.keywords) article.keywords = page.keywords.join(', ');
    if (page.mentions) article.mentions = page.mentions.map((m) => ({ '@type': 'Thing', name: m.name, sameAs: wikiUrl(m.wiki) }));
    if (citeSources.length) article.citation = citeSources.map(citationNode);
    graph.push(article);
  }

  // Compléments spécifiques
  if (page.faq) {
    graph.push({
      '@type': 'FAQPage',
      '@id': url + '#faq',
      isPartOf: { '@id': PAGE },
      inLanguage: 'fr',
      mainEntity: page.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: stripTags(f.a) },
      })),
    });
  }
  if (page.slug === 'echelle' || page.slug === '') {
    graph.push({
      '@type': 'ItemList',
      '@id': url + '#echelle',
      name: 'Échelle de la certitude scientifique (9 niveaux)',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: ladder.length,
      itemListElement: ladder.map((l) => ({
        '@type': 'ListItem',
        position: l.n + 1,
        name: `Niveau ${l.n} — ${l.name}`,
        description: stripTags(l.what),
        url: abs('echelle/') + `#niveau-${l.n}`,
      })),
    });
  }
  if (page.generate === 'glossaire') {
    graph.push({
      '@type': 'DefinedTermSet',
      '@id': url + '#termes',
      name: 'Glossaire de la certitude scientifique',
      inLanguage: 'fr',
      hasDefinedTerm: glossary.map((g) => ({
        '@type': 'DefinedTerm',
        '@id': url + '#' + g.id,
        name: g.term,
        description: stripTags(g.def),
        inDefinedTermSet: url + '#termes',
        url: url + '#' + g.id,
        ...(g.wiki ? { sameAs: wikiUrl(g.wiki) } : {}),
      })),
    });
  }
  if (page.generate === 'sources') {
    graph.push({
      '@type': 'ItemList',
      '@id': url + '#bibliographie',
      name: 'Bibliographie',
      numberOfItems: sources.length,
      itemListElement: sources.map((s, i) => ({ '@type': 'ListItem', position: i + 1, item: citationNode(s) })),
    });
  }
  if (page.slug === '') {
    graph.push({
      '@type': 'ItemList',
      '@id': url + '#sommaire',
      name: 'Parcours du site',
      itemListElement: pages.filter((p) => p.slug && p.slug !== '404').map((p, i) => ({
        '@type': 'ListItem', position: i + 1, name: p.title, url: abs(p.slug + '/'),
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

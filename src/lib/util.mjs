// Utilitaires partagés (échappement, typographie française, liens Wikipédia)

export const escapeHtml = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const escapeAttr = escapeHtml;

export const stripTags = (s = '') =>
  String(s).replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#8239;/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();

export const wikiUrl = (ref) => {
  const m = String(ref).match(/^([a-z]{2}):(.+)$/);
  const [lang, title] = m ? [m[1], m[2]] : ['fr', ref];
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_')).replace(/%2F/g, '/')}`;
};

const NNBSP = ' '; // espace fine insécable
const NBSP = ' ';  // espace insécable

/** Typographie française appliquée aux seuls nœuds texte (hors script/style/code/pre). */
export function typo(html) {
  const parts = html.split(/(<[^>]+>)/g);
  let skip = 0;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith('<')) {
      const m = p.match(/^<\/?\s*(script|style|code|pre|kbd|samp|math)\b/i);
      if (m) skip += p.startsWith('</') ? -1 : 1;
      continue;
    }
    if (skip > 0 || !p.trim()) continue;
    parts[i] = p
      .replace(/ ([;!?%])/g, NNBSP + '$1')
      .replace(/ :(?=\s|$)/g, NBSP + ':')
      .replace(/« /g, '«' + NBSP)
      .replace(/ »/g, NBSP + '»')
      .replace(/(^|[^\d,. ])(\d{1,3}) (?=\d{3}(?!\d))/g, '$1$2' + NNBSP)
      .replace(/( \d{3}) (?=\d{3}(?!\d))/g, '$1' + NNBSP)
      .replace(/( \d{3}) (?=\d{3}(?!\d))/g, '$1' + NNBSP)
      .replace(/(\d) (€|°C|%|km|Mpc|ms|ns|μs|GeV|Ga|nm|kg|m\/s|ppt|ppb)(?![\p{L}])/gu, '$1' + NBSP + '$2')
      .replace(/([\p{L}])'(?=[\p{L}«]|$)/gu, '$1\u2019')
      .replace(/\.\.\./g, '…')
      .replace(/ — /g, NBSP + '— ');
  }
  return parts.join('');
}

export const isoDate = (d) => new Date(d).toISOString().slice(0, 10);

export const frDate = (d) =>
  new Date(d + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

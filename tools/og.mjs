#!/usr/bin/env node
/**
 * Génère les images de partage (Open Graph, 1200×630) et les icônes PNG.
 * Outil de développement : nécessite Playwright et sharp (npm i -D playwright sharp).
 * Usage : node tools/og.mjs && node build.mjs
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const load = (m) => { try { return require(m); } catch { return require(join(process.env.NODE_GLOBAL || '/home/claude/.npm-global/lib/node_modules', m)); } };
const { chromium } = load('playwright');
const sharp = load('sharp');

const site = JSON.parse(readFileSync(join(ROOT, 'src/site.json'), 'utf8'));
const pages = readdirSync(join(ROOT, 'src/pages')).filter((f) => f.endsWith('.html')).map((f) => {
  const m = readFileSync(join(ROOT, 'src/pages', f), 'utf8').match(/^---json\s*\n([\s\S]*?)\n---/);
  return JSON.parse(m[1]);
}).filter((p) => p.slug !== '404');

const COLORS = ['#9fe0c0', '#a6dcb8', '#aed8b3', '#b4d3b9', '#b9cdc4', '#bdc4d4', '#c3bde6', '#c7b8f2', '#e8cf9a'];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/ ([?:!;%])/g, '\u00a0$1').replace(/-(elle|il|on)\b/g, '\u2011$1');

const html = (p) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;background:#0e1311;color:#e3eae5;font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"DejaVu Serif",serif;position:relative}
.h1{position:absolute;right:-160px;top:-200px;width:760px;height:760px;border-radius:50%;background:radial-gradient(closest-side,rgba(169,150,230,.22),transparent 70%)}
.h2{position:absolute;left:-200px;bottom:-300px;width:760px;height:760px;border-radius:50%;background:radial-gradient(closest-side,rgba(124,199,154,.16),transparent 70%)}
.enso{position:absolute;right:70px;top:50%;transform:translateY(-50%);width:340px;height:340px;opacity:.95}
.txt{position:absolute;left:80px;top:78px;width:720px;height:474px;display:flex;flex-direction:column}
.brand{font-size:30px;letter-spacing:-.01em}.brand span{font-family:system-ui,"DejaVu Sans",sans-serif;font-size:19px;color:#8a9b92;margin-left:8px}
.kick{margin-top:auto;font-style:italic;color:#c7b8f2;font-size:28px}
h1{font-weight:500;font-size:${p.title.length > 60 ? 50 : p.title.length > 40 ? 58 : 66}px;line-height:1.08;letter-spacing:-.02em;margin-top:14px}
.meter{display:flex;gap:7px;margin-top:34px}.meter i{display:block;width:44px;height:11px;border-radius:9px;background:#26332d}
.foot{margin-top:22px;font-family:system-ui,"DejaVu Sans",sans-serif;font-size:19px;color:#8a9b92}
</style></head><body><div class="h1"></div><div class="h2"></div>
<svg class="enso" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a6dcb8"/><stop offset="1" stop-color="#c7b8f2"/></linearGradient></defs><circle cx="32" cy="32" r="24" fill="none" stroke="url(#g)" stroke-width="3.2" stroke-linecap="round" pathLength="100" stroke-dasharray="93 7" transform="rotate(-62 32 32)"/><circle cx="32" cy="32" r="2.2" fill="#c7b8f2"/></svg>
<div class="txt"><div class="brand">Rien <span>(ou presque)</span></div>
<div class="kick">${esc(p.kicker || site.tagline)}</div>
<h1>${esc(p.title)}</h1>
<div class="meter">${COLORS.map((c, i) => `<i style="${p.levels && i >= p.levels[0] && i <= p.levels[1] ? `background:${c};box-shadow:0 0 16px ${c}66` : ''}"></i>`).join('')}</div>
<div class="foot">ouaisfieu.github.io/rien</div></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const p of pages) {
  await page.setContent(html(p));
  const out = join(ROOT, 'src/assets', `og-${p.slug || 'accueil'}.png`);
  const buf = await page.screenshot({ type: 'png' });
  await sharp(buf).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(out);
  console.log('✓', out.replace(ROOT + '/', ''));
}
await browser.close();

// Icônes
const svg = readFileSync(join(ROOT, 'src/assets/favicon.svg'));
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(join(ROOT, 'src/assets', name));
  console.log('✓', name);
}

/**
 * Construit le sprite SVG à partir des icônes de assets/icons/
 * et l'injecte dans index.html entre <!-- sprite:start --> et <!-- sprite:end -->.
 * (Sprite inline : fonctionne aussi en ouvrant index.html directement, en file://)
 *
 * Usage : node tools/build-sprite.js
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const iconsDir = path.join(root, 'assets', 'icons');
const FILLED = new Set(['tiktok']); // icônes pleines (Simple Icons) — les autres sont en trait (Lucide)

const symbols = fs.readdirSync(iconsDir)
  .filter((f) => f.endsWith('.svg') && f !== 'sprite.svg')
  .sort()
  .map((file) => {
    const name = path.basename(file, '.svg');
    const src = fs.readFileSync(path.join(iconsDir, file), 'utf8');
    const inner = src
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/^[\s\S]*?<svg[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '')
      .replace(/<title>[\s\S]*?<\/title>/, '')
      .replace(/\s*\n\s*/g, '')
      .trim();
    const attrs = FILLED.has(name)
      ? 'fill="currentColor" stroke="none"'
      : 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
    return `<symbol id="i-${name}" viewBox="0 0 24 24" ${attrs}>${inner}</symbol>`;
  });

const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">${symbols.join('')}</svg>`;
fs.writeFileSync(path.join(iconsDir, 'sprite.svg'), sprite + '\n');

const indexPath = path.join(root, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');
const out = html.replace(
  /<!-- sprite:start -->[\s\S]*?<!-- sprite:end -->/,
  `<!-- sprite:start -->\n  ${sprite}\n  <!-- sprite:end -->`
);
fs.writeFileSync(indexPath, out);
console.log(`Sprite : ${symbols.length} icônes injectées dans index.html`);

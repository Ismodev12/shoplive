/**
 * Mini serveur statique de développement (aucune dépendance).
 * Usage : node tools/serve.js [port]   → http://localhost:5173
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.argv[2]) || 5173;
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8'
};

/** En local, affiche les champs d'un formulaire envoyé (ce que Netlify Forms recevra en ligne). */
function logFormPost(req) {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    const fields = Object.fromEntries(new URLSearchParams(body));
    console.log(`\n[Formulaire « ${fields['form-name'] || '?'} »] champs reçus :`);
    for (const [k, v] of Object.entries(fields)) console.log(`  ${k} = ${v}`);
  });
}

http.createServer((req, res) => {
  if (req.method === 'POST') logFormPost(req);
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(root, urlPath === '/' ? 'index.html' : urlPath);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(port, () => console.log(`SHOP LIVE → http://localhost:${port}`));

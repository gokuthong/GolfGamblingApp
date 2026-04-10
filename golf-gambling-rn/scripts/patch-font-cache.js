/**
 * Post-build script: adds cache-buster query param to the MaterialCommunityIcons
 * font URL in the JS bundle, AND adds a cache-buster to the <script src> in
 * index.html so browsers re-download the patched bundle.
 *
 * Runs automatically as part of `npm run build:web`.
 */
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const DIST_JS_DIR = path.join(DIST_DIR, '_expo', 'static', 'js', 'web');
const BUST = '?v=2';
const FONT_RE = /MaterialCommunityIcons\.b62641afc9ab487008e996a5c5865e56\.ttf(?!\?v=)/g;

// 1) Patch font URLs in JS bundle(s)
let files;
try {
  files = fs.readdirSync(DIST_JS_DIR).filter(f => f.endsWith('.js'));
} catch (e) {
  console.log('[patch-font-cache] No JS bundle directory found, skipping.');
  process.exit(0);
}

let patched = 0;
for (const file of files) {
  const filePath = path.join(DIST_JS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const matches = content.match(FONT_RE);
  if (matches) {
    content = content.replace(FONT_RE, (m) => m + BUST);
    fs.writeFileSync(filePath, content, 'utf8');
    patched += matches.length;
    console.log(`[patch-font-cache] Patched ${matches.length} font URL(s) in ${file}`);
  }
}

// 2) Add cache-buster to <script src> in index.html so the browser fetches the patched JS
const htmlPath = path.join(DIST_DIR, 'index.html');
if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  // Match the Expo-generated script src and add a timestamp cache-buster
  const ts = Date.now();
  html = html.replace(
    /(<script\s+src="[^"]+\.js)(")/,
    `$1?cb=${ts}$2`
  );
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`[patch-font-cache] Added cache-buster (cb=${ts}) to script src in index.html`);
}

if (patched === 0) {
  console.log('[patch-font-cache] No font URLs needed patching.');
} else {
  console.log(`[patch-font-cache] Done. Patched ${patched} total URL(s).`);
}

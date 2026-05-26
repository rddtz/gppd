/**
 * postinstall.mjs - applied after every `npm install`
 *
 * Patches Astro to run on Node 18.20.x (system default on Debian Bookworm).
 * Astro requires 18.20.8+ but 18.20.4 works fine except for two issues:
 *
 * 1. astro.js CLI wrapper: version guard requires >=18.20.8 - lower it to >=18.20.4
 * 2. response.js dev server: Headers.getSetCookie() added in Node 20 - add optional chaining
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');

function patch(relPath, search, replacement) {
  const abs = resolve(root, relPath);
  const before = readFileSync(abs, 'utf8');
  if (!before.includes(search)) {
    // Already patched or file changed - skip silently
    return;
  }
  const after = before.replace(search, replacement);
  writeFileSync(abs, after);
  console.log('[postinstall] patched', relPath);
}

// Patch 1: lower version guard
patch(
  'node_modules/astro/astro.js',
  "const engines = '>=18.20.8';",
  "const engines = '>=18.20.4';",
);

// Patch 2: optional chaining for Headers.getSetCookie (Node 18 compat)
patch(
  'node_modules/astro/dist/vite-plugin-astro-server/response.js',
  '...headers.getSetCookie()]',
  '...(headers.getSetCookie?.() ?? [])]',
);

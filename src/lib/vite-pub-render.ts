/**
 * Vite plugin (enforce:'pre') that transforms #+PUB: org directives into
 * rendered #+BEGIN_EXPORT html blocks BEFORE orgajs processes the file.
 *
 * This works because @orgajs/rollup also registers as enforce:'pre', but
 * user-config plugins run before integration-injected plugins in Vite, so
 * our transform sees the raw org source before @orgajs compiles it.
 *
 * For markdown, publication rendering is handled by the remarkPubRender
 * remark plugin in src/lib/remark-pub-render.ts (registered in astro.config).
 *
 * Org syntax:
 *   #+PUB: titulo="X" venue="Y" ano=2025 tipo=conference autores="A, B" doi="10.x"
 */

import type { Plugin } from 'vite';

// -- Attribute parser --------------------------------------------------

function parseAttrs(s: string): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  const re = /(\w+)="([^"]*)"|(\w+)='([^']*)'|(\w+)=(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const key = (m[1] ?? m[3] ?? m[5])!;
    const val = (m[2] ?? m[4] ?? m[6])!;
    result[key] = /^\d+$/.test(val) ? Number(val) : val;
  }
  return result;
}

// -- HTML renderer -----------------------------------------------------

function renderPubHTML(attrs: Record<string, string | number>): string {
  const titulo  = String(attrs.titulo  ?? '');
  const venue   = String(attrs.venue   ?? '');
  const ano     = String(attrs.ano     ?? '');
  const doi     = attrs.doi ? String(attrs.doi) : '';
  const url     = attrs.url ? String(attrs.url) : '';
  const autores = String(attrs.autores ?? '')
    .split(/\s*,\s*/).filter(Boolean);

  if (!titulo) return '';

  const titleInner = doi
    ? `<a href="https://doi.org/${doi}" target="_blank" rel="noopener">${titulo}</a>`
    : url
    ? `<a href="${url}" target="_blank" rel="noopener">${titulo}</a>`
    : titulo;

  const metaParts = [
    venue ? `<em>${venue}</em>` : '',
    ano,
  ].filter(Boolean).join(' &middot; ');

  return [
    '<div class="gp-pub-entry">',
    `  <div class="gp-pub-entry-title">${titleInner}</div>`,
    `  <div class="gp-pub-entry-meta">${metaParts}</div>`,
    `  <div class="gp-pub-entry-authors">${autores.join(' &middot; ')}</div>`,
    '</div>',
  ].join('\n');
}

// -- Vite plugin -------------------------------------------------------

export function pubRenderPlugin(): Plugin {
  return {
    name: 'gppd-pub-render',
    enforce: 'pre',   // runs before @orgajs/rollup (also enforce:'pre' but integration-injected)

    transform(code, id) {
      // Strip Vite query params before checking extension
      const base = id.split('?')[0];

      // Only org content files (markdown is handled by remarkPubRender)
      if (!base.includes('/content/pesquisadores/')) return null;
      if (!base.endsWith('.org')) return null;

      // Replace each #+PUB: line with a block-level HTML export
      // (#+BEGIN_EXPORT html ... #+END_EXPORT is correct for block content)
      let modified = false;
      const result = code.replace(/^#\+PUB:\s*(.+)$/gm, (_, raw) => {
        const attrs = parseAttrs(raw);
        const html  = renderPubHTML(attrs);
        if (!html) return '';
        modified = true;
        return `\n#+BEGIN_EXPORT html\n${html}\n#+END_EXPORT\n`;
      });

      return modified ? result : null;
    },
  };
}

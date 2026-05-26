/**
 * Remark plugin: replaces <!-- pub ... --> HTML comments in markdown
 * with rendered pub-entry HTML at AST time (before JS compilation).
 *
 * This is the correct hook for markdown because Astro's markdown pipeline
 * uses a Vite `load` hook, so a Vite `transform` hook sees compiled JS
 * (not raw markdown). Remark plugins run during the load phase, on the
 * markdown AST, before any JS is emitted.
 *
 * Syntax:
 *   <!-- pub titulo="X" venue="Y" ano=2025 tipo=conference autores="A, B" doi="10.x" -->
 */

import { visit } from 'unist-util-visit';

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

// -- Plugin ------------------------------------------------------------

export function remarkPubRender() {
  return function (tree: any) {
    visit(tree, 'html', (node: any) => {
      const match = (node.value as string).match(
        /<!--\s*@?pub\s+([\s\S]*?)\s*-->/i,
      );
      if (!match) return;
      const attrs = parseAttrs(match[1].replace(/\n/g, ' '));
      const html = renderPubHTML(attrs);
      if (html) node.value = html;
    });
  };
}

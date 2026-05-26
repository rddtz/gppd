/**
 * Custom Astro 5 content loader for the pesquisadores collection.
 *
 * Publication tags — invisible in the member page, aggregated in /publicacoes
 * ---------------------------------------------------------------------------
 * The member writes their publication list however they like in the body text
 * (plain text, org lists, markdown bullets, etc.).  Anywhere in the file they
 * add an invisible extraction tag so the publication also appears on the
 * /publicacoes aggregation page.
 *
 * Markdown (HTML comment, completely invisible):
 *   <!-- pub titulo="X" venue="Y" ano=2025 tipo=conference autores="A, B" doi="10.x" -->
 *
 * Org-mode (org keyword, never rendered as content):
 *   #+PUB: titulo="X" venue="Y" ano=2025 tipo=conference autores="A, B"
 *
 * Additionally, <pub .../> tags and #+BEGIN_EXPORT html <pub/> blocks from
 * the previous iteration are still extracted for backward compatibility.
 */

import type { Loader } from 'astro/loaders';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import yaml from 'js-yaml';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export interface PubEntry {
  titulo: string;
  venue: string;
  ano: number;
  tipo: 'journal' | 'conference' | 'workshop' | 'thesis' | 'preprint';
  doi?: string;
  url?: string;
  autores: string[];
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/** Parse key="value" / key='value' / key=bare attribute strings. */
function parseAttrs(s: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const re = /(\w+)="([^"]*)"|(\w+)='([^']*)'|(\w+)=(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const key = (m[1] ?? m[3] ?? m[5])!;
    const val = (m[2] ?? m[4] ?? m[6])!;
    result[key] = /^\d+$/.test(val) ? Number(val) : val;
  }
  return result;
}

function normalizePub(raw: Record<string, unknown>): PubEntry | null {
  if (!raw.titulo) return null;
  const autoresRaw = raw.autores as string | undefined;
  const tipos = ['journal', 'conference', 'workshop', 'thesis', 'preprint'] as const;
  const tipoRaw = String(raw.tipo ?? 'conference');
  const tipo = tipos.includes(tipoRaw as (typeof tipos)[number])
    ? (tipoRaw as PubEntry['tipo'])
    : 'conference';
  return {
    titulo:  String(raw.titulo),
    venue:   String(raw.venue ?? ''),
    ano:     Number(raw.ano ?? 0),
    tipo,
    doi:     raw.doi  ? String(raw.doi)  : undefined,
    url:     raw.url  ? String(raw.url)  : undefined,
    autores: autoresRaw ? autoresRaw.split(/\s*,\s*/).filter(Boolean) : [],
  };
}

/**
 * Extract <pub .../> elements from markdown body.
 * These are the new visible format — the element stays in the body and is
 * rendered in-place by the client-side script.
 */
function extractPubTagsMd(body: string): PubEntry[] {
  const pubs: PubEntry[] = [];
  // Match <pub attr1="v1" attr2=v2 />  (self-closing, optional spaces before />)
  const re = /<pub\s+([^>]*?)\s*\/>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const pub = normalizePub(parseAttrs(m[1].replace(/\n/g, ' ')));
    if (pub) pubs.push(pub);
  }
  return pubs;
}

/**
 * Extract legacy <!-- pub ... --> HTML comment markers from markdown body.
 * These are invisible in the rendered output but still aggregated.
 */
function extractLegacyPubsMd(body: string): PubEntry[] {
  const pubs: PubEntry[] = [];
  const re = /<!--\s*@?pub\s+([\s\S]*?)\s*-->/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const pub = normalizePub(parseAttrs(m[1].replace(/\n/g, ' ')));
    if (pub) pubs.push(pub);
  }
  return pubs;
}

/**
 * Extract <pub .../> elements from org content.
 * The user writes them inside @@html:...@@ export snippets or
 * #+BEGIN_EXPORT html ... #+END_EXPORT blocks so orgajs passes them
 * through as raw HTML.
 *
 * Supported org formats:
 *   @@html:<pub titulo="X" ... />@@
 *   #+BEGIN_EXPORT html
 *   <pub titulo="X" ... />
 *   #+END_EXPORT
 */
function extractPubTagsOrg(content: string): PubEntry[] {
  const pubs: PubEntry[] = [];

  // Inline export: @@html:<pub .../>@@
  const reInline = /@@html:<pub\s+([^>]*?)\s*\/??>@@/gi;
  let m: RegExpExecArray | null;
  while ((m = reInline.exec(content)) !== null) {
    const pub = normalizePub(parseAttrs(m[1]));
    if (pub) pubs.push(pub);
  }

  // Block export: #+BEGIN_EXPORT html ... #+END_EXPORT
  const reBlock = /^#\+BEGIN_EXPORT\s+html\s*\n([\s\S]*?)^#\+END_EXPORT/gim;
  while ((m = reBlock.exec(content)) !== null) {
    const inner = m[1];
    const rePub = /<pub\s+([^>]*?)\s*\/>/gi;
    let mp: RegExpExecArray | null;
    while ((mp = rePub.exec(inner)) !== null) {
      const pub = normalizePub(parseAttrs(mp[1]));
      if (pub) pubs.push(pub);
    }
  }

  return pubs;
}

/** Extract legacy #+PUB: ... keyword lines (invisible, aggregation-only). */
function extractLegacyPubsOrg(content: string): PubEntry[] {
  const pubs: PubEntry[] = [];
  const re = /^#\+PUB:\s*(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const pub = normalizePub(parseAttrs(m[1]));
    if (pub) pubs.push(pub);
  }
  return pubs;
}

/** Parse YAML frontmatter delimited by --- lines. */
function splitFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  if (!raw.startsWith('---')) return { data: {}, content: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { data: {}, content: raw };
  const fmStr  = raw.slice(3, end).trim();
  const content = raw.slice(end + 4).trimStart();
  let data: Record<string, unknown> = {};
  try { data = (yaml.load(fmStr) as Record<string, unknown>) ?? {}; } catch { /* ignore */ }
  return { data, content };
}

/**
 * Parse org-mode #+KEY: VALUE header keywords into a plain object.
 * Keys are lowercased. Skips built-in org keywords and pub/pub_show.
 */
function parseOrgKeywords(content: string): Record<string, unknown> {
  const skip = new Set(['startup', 'title', 'author', 'date', 'options', 'pub', 'pub_show']);
  const kw: Record<string, unknown> = {};
  const re = /^#\+([A-Z_]+):\s*(.*)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const key = m[1].toLowerCase();
    if (!skip.has(key)) kw[key] = m[2].trim();
  }
  return kw;
}

/** Normalize linhas to string[] regardless of input type. */
function normalizeLinhas(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === 'string') return v.split(/[\s,]+/).filter(Boolean);
  return [];
}

// ------------------------------------------------------------------
// Loader
// ------------------------------------------------------------------

export function pesquisadoresLoader(): Loader {
  return {
    name: 'pesquisadores',

    async load({ store, parseData, logger }: Parameters<Loader['load']>[0]) {
      const baseDir = join(process.cwd(), 'src', 'content', 'pesquisadores');

      let files: string[];
      try {
        files = await readdir(baseDir);
      } catch {
        logger.warn('pesquisadores-loader: directory not found: ' + baseDir);
        return;
      }

      for (const file of files) {
        if (!file.match(/\.(md|org)$/i)) continue;

        const absPath  = join(baseDir, file);
        const raw      = await readFile(absPath, 'utf8');
        const id       = file.replace(/\.(md|org)$/i, '');
        const relPath  = 'src/content/pesquisadores/' + file;

        let frontmatter: Record<string, unknown> = {};
        let body = raw;
        let pubs: PubEntry[] = [];

        if (file.endsWith('.md')) {
          const { data, content } = splitFrontmatter(raw);
          frontmatter = data;
          body = content;
          // New visible format + legacy invisible format
          pubs = [...extractPubTagsMd(body), ...extractLegacyPubsMd(body)];
        } else {
          frontmatter = parseOrgKeywords(raw);
          body = raw;
          // New visible format (@@html:<pub>@@ / #+BEGIN_EXPORT html) + legacy #+PUB:
          pubs = [...extractPubTagsOrg(raw), ...extractLegacyPubsOrg(raw)];
        }

        // Merge with any frontmatter publicacoes (rare but supported)
        const fmPubs: PubEntry[] = Array.isArray(frontmatter.publicacoes)
          ? (frontmatter.publicacoes as PubEntry[])
          : [];
        delete frontmatter.publicacoes;

        frontmatter.linhas = normalizeLinhas(frontmatter.linhas);

        let data: Record<string, unknown>;
        try {
          data = await parseData({ id, data: { ...frontmatter, publicacoes: [...fmPubs, ...pubs] } });
        } catch (err) {
          logger.error('pesquisadores-loader: parse error in ' + file + ': ' + String(err));
          continue;
        }

        store.set({ id, data, body, filePath: relPath });
      }
    },
  };
}

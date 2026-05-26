import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { pesquisadoresLoader } from './lib/pesquisadores-loader';
// Nota: foto e uma URL/caminho string (ex: /schnorr.png ou https://...) para manter simplicidade.

// Schema de uma publicacao extraida do corpo do arquivo.
const publicacaoSchema = z.object({
  titulo:  z.string(),
  venue:   z.string(),
  ano:     z.number(),
  tipo:    z.enum(['journal', 'conference', 'workshop', 'thesis', 'preprint']).default('conference'),
  autores: z.array(z.string()),
  doi:     z.string().optional(),
  url:     z.string().optional(),
});

const pesquisadores = defineCollection({
  loader: pesquisadoresLoader(),
  schema: () =>
    z.object({
      // Identidade
      nome:   z.string(),
      cargo:  z.string().optional(),   // preferido: "Professor Associado", "Doutorando"
      role:   z.string().optional(),   // legado — alias de cargo
      grupo:  z.string().default('Estudantes'),

      // Foto (URL/caminho: /schnorr.png ou https://...)
      foto: z.string().optional().nullable(),

      // Pesquisa
      area:   z.string().optional(),   // legado
      linhas: z.array(z.string()).default([]),

      // Vinculo
      ingresso:   z.coerce.string().optional(),
      saida:      z.coerce.string().optional(),   // ano de saida (egressos)
      orientador: z.string().optional(),

      // Links
      lattes:   z.string().optional(),
      orcid:    z.string().optional(),
      github:   z.string().optional(),
      email:    z.string().optional(),
      homepage: z.string().optional(),

      // Publicacoes — preenchidas pelo loader a partir das tags inline no texto
      publicacoes: z.array(publicacaoSchema).default([]),

      // Meta
      description:     z.string().optional(),
      tags:            z.array(z.string()).default([]),
      publicationdate: z.coerce.date().optional().nullable(),
      updateddate:     z.coerce.date().optional().nullable(),
    }),
});

export const collections = { pesquisadores };

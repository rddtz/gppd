import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Gera um indice JSON estatico com todo o conteudo buscavel do site.
// Consumido pelo campo de busca do header via fetch() no cliente.

export const GET: APIRoute = async () => {
  const membros = await getCollection('pesquisadores');

  const index = membros.map(m => ({
    tipo: 'membro',
    id: m.id,
    nome: m.data.nome ?? m.id,
    cargo: m.data.cargo ?? m.data.role ?? '',
    grupo: m.data.grupo ?? '',
    bio: m.data.description ?? '',
    linhas: (m.data.linhas ?? []).join(' '),
    url: `/pessoas/${m.id}`,
  }));

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};

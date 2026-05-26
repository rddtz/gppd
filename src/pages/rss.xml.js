import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export async function GET(context) {
  const membros = await getCollection('pesquisadores');
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: membros.map(m => ({
      title: m.data.nome,
      description: m.data.description ?? '',
      pubDate: m.data.publicationdate ?? new Date(),
      link: `/pessoas/${m.id}/`,
    })),
  });
}

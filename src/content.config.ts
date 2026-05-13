import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const pesquisadores = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/pesquisadores', pattern: '**/*.{md,mdx,org}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			name: z.string(),
			role: z.string(), // set to be only from a const list from a file definitions.ts
			area: z.string(), // same here
			ingresso: z.string(), // same here
			tags: z.array(z.string()),
			foto: image().optional().nullable(),
			description: z.string().optional().nullable(),
			// Transform string to Date object
			pubDate: z.coerce.date().optional().nullable(),
			updatedDate: z.coerce.date().optional().nullable(),
		}),
});

export const collections = { pesquisadores };

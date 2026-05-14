import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const pesquisadores = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	//loader: glob({ base: './src/content/pesquisadores', pattern: '**/*.{md,mdx,org}' }),
	type: "content",
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			nome: z.string(),
			role: z.string(), // set to be only from a const list from a file definitions.ts
			area: z.string(), // same here
			ingresso: z.string(), // same here
			tags: z.union([z.array(z.string()), z.string()])
				.transform(val => Array.isArray(val) ? val : val.split(' ')),
			foto: image().optional().nullable(),
			description: z.string().optional().nullable(),
			// Transform string to Date object
			publicationdate: z.coerce.date().optional().nullable(),
			updateddate: z.coerce.date().optional().nullable(),
		}),
});

export const collections = { pesquisadores };

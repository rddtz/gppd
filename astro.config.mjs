// @ts-check

import mdx from '@astrojs/mdx';
import orgMode from '@orgajs/astro'
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { pubRenderPlugin } from './src/lib/vite-pub-render.ts';
import { remarkPubRender } from './src/lib/remark-pub-render.ts';

// https://astro.build/config
export default defineConfig({
	site: 'https://example.com',
	integrations: [mdx(), sitemap(), orgMode()],
	vite: {
		plugins: [pubRenderPlugin()],
	},
	markdown: {
		remarkPlugins: [remarkPubRender],
		syntaxHighlight: 'prism'
	}
	/*
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],*/
});

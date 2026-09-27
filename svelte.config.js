import { mdsvex, code_highlighter } from 'mdsvex';
import adapter from '@sveltejs/adapter-static';
import rehypeSlug from 'rehype-slug';
import remarkMath from 'remark-math';
import rehypeKatexSvelte from 'rehype-katex-svelte';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { mermaidBlock } from './tooling/markdown/mermaid.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries and mdsvex files.
		// mdsvex emits `export let` for frontmatter, which is invalid in runes mode.
		// Can be removed in svelte 6.
		runes: ({ filename }) => {
			if (filename.split(/[/\\]/).includes('node_modules')) return undefined;
			if (filename.endsWith('.md') || filename.endsWith('.svx')) return undefined;
			return true;
		}
	},
	kit: {
		adapter: adapter(),
		prerender: {
			handleUnseenRoutes: 'ignore'
		}
	},
	preprocess: [
		mdsvex({
			extensions: ['.svx', '.md'],
			// ```mermaid fences render to inline SVG at build time; every other
			// language keeps mdsvex's default Prism highlighting.
			highlight: {
				highlighter: (code, lang, meta, filename, optimise) =>
					lang === 'mermaid'
						? mermaidBlock(code, filename)
						: code_highlighter(code, lang, meta, filename, optimise)
			},
			// remark-math is pinned to an old major: mdsvex bundles an older
			// remark, and newer plugin versions target a micromark-based tree
			// it cannot parse.
			remarkPlugins: [remarkMath],
			rehypePlugins: [rehypeKatexSvelte, rehypeSlug],
			layout: {
				'docs': resolve(__dirname, 'src/lib/layouts/Article.svelte'),
				'dev-logs': resolve(__dirname, 'src/lib/layouts/Article.svelte'),
				'wiki': resolve(__dirname, 'src/lib/layouts/Article.svelte')
			}
		})
	],
	extensions: ['.svelte', '.svx', '.md']
};

export default config;

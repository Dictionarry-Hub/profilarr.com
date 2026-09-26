import type { RequestHandler } from './$types';
import { docToMarkdown, type DocMeta } from '$lib/shared/utils/llm/index.js';

export const prerender = true;

// Mirror of the docs root page. Child pages are served by /docs/[slug].md.

const modules = import.meta.glob<{ metadata: DocMeta }>('/src/routes/docs/+page.svx', {
	eager: true
});

const sources = import.meta.glob<string>('/src/routes/docs/+page.svx', {
	eager: true,
	query: '?raw',
	import: 'default'
});

export const GET: RequestHandler = () => {
	const [path, module] = Object.entries(modules)[0];
	const markdown = docToMarkdown(module.metadata, sources[path], '');

	return new Response(markdown, {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
	});
};

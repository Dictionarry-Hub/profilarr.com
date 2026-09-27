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

const dataModules = import.meta.glob<Record<string, unknown>>('/src/routes/docs/data.ts', {
	eager: true
});

export const GET: RequestHandler = () => {
	const [path, module] = Object.entries(modules)[0];
	const data = Object.values(dataModules)[0] ?? {};
	const markdown = docToMarkdown(module.metadata, sources[path], '', data);

	return new Response(markdown, {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
	});
};

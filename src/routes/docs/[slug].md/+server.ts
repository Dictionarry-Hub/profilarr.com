import { error } from '@sveltejs/kit';
import type { EntryGenerator, RequestHandler } from './$types';
import { docSlugFromPath, docToMarkdown, type DocMeta } from '$lib/shared/utils/llm/index.js';

export const prerender = true;

const modules = import.meta.glob<{ metadata: DocMeta }>('/src/routes/docs/**/+page.svx', {
	eager: true
});

const sources = import.meta.glob<string>('/src/routes/docs/**/+page.svx', {
	eager: true,
	query: '?raw',
	import: 'default'
});

// The root page has an empty slug and its own mirror at /docs.md.
export const entries: EntryGenerator = () =>
	Object.keys(modules)
		.map((path) => ({ slug: docSlugFromPath(path) }))
		.filter((entry) => entry.slug !== '');

export const GET: RequestHandler = ({ params }) => {
	const path = Object.keys(modules).find((p) => docSlugFromPath(p) === params.slug);

	if (!path) error(404, 'Not found');

	const markdown = docToMarkdown(modules[path].metadata, sources[path], params.slug);

	return new Response(markdown, {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
	});
};

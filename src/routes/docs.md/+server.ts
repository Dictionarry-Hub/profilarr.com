import type { RequestHandler } from './$types';
import {
	docNext,
	docSlugFromPath,
	docToMarkdown,
	type DocMeta
} from '$lib/shared/utils/llm/index.js';

export const prerender = true;

// Mirror of the docs root page. Child pages are served by /docs/[slug].md.

// Every docs page's metadata, to resolve the root page's `next` links.
const modules = import.meta.glob<{ metadata: DocMeta }>('/src/routes/docs/**/+page.svx', {
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
	const docs = Object.entries(modules).map(([path, module]) => ({
		...module.metadata,
		slug: docSlugFromPath(path)
	}));
	const root = docs.find((doc) => doc.slug === '')!;
	const [source] = Object.values(sources);
	const data = Object.values(dataModules)[0] ?? {};
	const markdown = docToMarkdown(root, source, '', data, docNext(root, docs));

	return new Response(markdown, {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
	});
};

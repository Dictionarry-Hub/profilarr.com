import type { RequestHandler } from './$types';
import { docNext, docToMarkdown } from '$lib/shared/utils/llm/index.js';
import { docSource, docsIndex, findDoc } from '$lib/server/docs';

export const prerender = true;

// Mirror of the home page, which is the docs root page. The other docs pages
// are served by /docs/[slug].md.

const sources = import.meta.glob<string>('/src/routes/+page.svx', {
	eager: true,
	query: '?raw',
	import: 'default'
});

const dataModules = import.meta.glob<Record<string, unknown>>('/src/routes/data.ts', {
	eager: true
});

export const GET: RequestHandler = () => {
	const root = findDoc('')!;
	const [source] = Object.values(sources);
	const data = Object.values(dataModules)[0] ?? {};
	const markdown = docToMarkdown(
		root,
		source,
		'',
		data,
		docNext(root, docsIndex),
		docsIndex,
		docSource('')
	);

	return new Response(markdown, {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
	});
};

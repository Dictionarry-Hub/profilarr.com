import { error } from '@sveltejs/kit';
import type { EntryGenerator, RequestHandler } from './$types';
import { docNext, docSlugFromPath, docToMarkdown } from '$lib/shared/utils/llm/index.js';
import { docsIndex, findDoc } from '$lib/server/docs';

export const prerender = true;

const sources = import.meta.glob<string>('/src/routes/docs/**/+page.svx', {
	eager: true,
	query: '?raw',
	import: 'default'
});

// Component data the pages embed, serialized into the Markdown. See
// componentsToMarkdown in $lib/shared/utils/llm/components.ts.
const dataModules = import.meta.glob<Record<string, unknown>>('/src/routes/docs/*/data.ts', {
	eager: true
});

// The root page has an empty slug and its own mirror at /index.md.
export const entries: EntryGenerator = () =>
	docsIndex.filter((doc) => doc.slug !== '').map((doc) => ({ slug: doc.slug }));

export const GET: RequestHandler = ({ params }) => {
	const path = Object.keys(sources).find((p) => docSlugFromPath(p) === params.slug);
	const doc = findDoc(params.slug);

	if (!path || !doc || params.slug === '') error(404, 'Not found');

	const dataPath = Object.keys(dataModules).find((p) => docSlugFromPath(p) === params.slug);
	const data = dataPath ? dataModules[dataPath] : {};
	const markdown = docToMarkdown(doc, sources[path], params.slug, data, docNext(doc, docsIndex));

	return new Response(markdown, {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
	});
};

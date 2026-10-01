import { error } from '@sveltejs/kit';
import type { EntryGenerator, RequestHandler } from './$types';
import { docNext, docSlugFromPath, docToMarkdown } from '$lib/shared/utils/llm/index.js';
import { docSource, docsIndex, findDoc } from '$lib/server/docs';

export const prerender = true;

// Every docs page's Markdown mirror, the root page's included. `?docs?` matches
// the `(docs)` route group. Vite treats escaped parentheses differently in dev
// and build, so the pattern avoids them.
const sources = import.meta.glob<string>(
	['/src/routes/+page.svx', '/src/routes/?docs?/**/+page.svx'],
	{
		eager: true,
		query: '?raw',
		import: 'default'
	}
);

// Component data the pages embed, serialized into the Markdown. See
// componentsToMarkdown in $lib/shared/utils/llm/components.ts.
const dataModules = import.meta.glob<Record<string, unknown>>(
	['/src/routes/data.ts', '/src/routes/?docs?/**/data.ts'],
	{ eager: true }
);

// Slugs are route paths (`installation/docker`), so the rest parameter takes
// them whole. The root page's slug is empty and `/.md` is no path, so its
// mirror is `/index.md`, the llms.txt convention for a URL without a file name.
const ROOT_PARAM = 'index';

export const entries: EntryGenerator = () =>
	docsIndex.map((doc) => ({ slug: doc.slug === '' ? ROOT_PARAM : doc.slug }));

export const GET: RequestHandler = ({ params }) => {
	if (params.slug === '') error(404, 'Not found');
	const slug = params.slug === ROOT_PARAM ? '' : params.slug;

	const path = Object.keys(sources).find((p) => docSlugFromPath(p) === slug);
	const doc = findDoc(slug);

	if (!path || !doc) error(404, 'Not found');

	const dataPath = Object.keys(dataModules).find((p) => docSlugFromPath(p) === slug);
	const data = dataPath ? dataModules[dataPath] : {};
	const markdown = docToMarkdown(
		doc,
		sources[path],
		slug,
		data,
		docNext(doc, docsIndex),
		docsIndex,
		docSource(slug)
	);

	return new Response(markdown, {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
	});
};

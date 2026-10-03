import { error } from '@sveltejs/kit';
import type { EntryGenerator, RequestHandler } from './$types';
import {
	docGroup,
	docGroupToMarkdown,
	docHasGroup,
	docNext,
	docSlugFromPath,
	docToMarkdown,
	type DocIndexEntry,
	type DocLink
} from '$lib/shared/utils/llm/index.js';
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

// A page with child pages also serves its group, the page and every page under
// it in one file, at its mirror path with `.group` before the extension
// (`/deploy/upgrades.group.md`). The rest parameter takes the suffix along with
// the slug, so both come from this route.
const GROUP_SUFFIX = '.group';

function slugParam(slug: string): string {
	return slug === '' ? ROOT_PARAM : slug;
}

export const entries: EntryGenerator = () => [
	...docsIndex.map((doc) => ({ slug: slugParam(doc.slug) })),
	...docsIndex
		.filter((doc) => docHasGroup(doc.slug, docsIndex))
		.map((doc) => ({ slug: `${slugParam(doc.slug)}${GROUP_SUFFIX}` }))
];

// One page's Markdown, under the title `doc` carries.
function pageMarkdown(doc: DocIndexEntry, next: DocLink[]): string {
	const path = Object.keys(sources).find((p) => docSlugFromPath(p) === doc.slug);
	if (!path) error(404, 'Not found');

	const dataPath = Object.keys(dataModules).find((p) => docSlugFromPath(p) === doc.slug);
	const data = dataPath ? dataModules[dataPath] : {};
	return docToMarkdown(doc, sources[path], doc.slug, data, next, docsIndex, docSource(doc.slug));
}

function mirrorMarkdown(slug: string): string {
	const doc = findDoc(slug);
	if (!doc) error(404, 'Not found');

	return pageMarkdown(doc, docNext(doc, docsIndex));
}

// Pages in a group leave out their `next` links: the file already holds the
// pages in reading order.
function groupMarkdown(slug: string): string {
	const group = docGroup(slug, docsIndex);
	if (!group) error(404, 'Not found');

	return docGroupToMarkdown(group, (doc) => pageMarkdown(doc, []));
}

export const GET: RequestHandler = ({ params }) => {
	if (params.slug === '') error(404, 'Not found');

	const isGroup = params.slug.endsWith(GROUP_SUFFIX);
	const param = isGroup ? params.slug.slice(0, -GROUP_SUFFIX.length) : params.slug;
	const slug = param === ROOT_PARAM ? '' : param;
	const markdown = isGroup ? groupMarkdown(slug) : mirrorMarkdown(slug);

	return new Response(markdown, {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
	});
};

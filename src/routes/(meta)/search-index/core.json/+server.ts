import type { RequestHandler } from './$types';
import type { DevLogMeta, DocMeta, WikiMeta } from '$lib/shared/utils/llm/index.js';
import { buildApiEndpointEntries } from '$lib/shared/utils/search/api.js';
import { buildDevLogEntry } from '$lib/shared/utils/search/devlog.js';
import { buildDocEntry, buildDocSectionEntries } from '$lib/shared/utils/search/docs.js';
import { docIndexEntry } from '$lib/shared/utils/llm/docs.js';
import { buildWikiEntry } from '$lib/shared/utils/search/wiki.js';
import { applyRatings } from '$lib/shared/utils/search/ratings.js';
import { loadApiSpec } from '$lib/shared/utils/openapi/index.js';

export const prerender = true;

// Database-independent search entries: Profilarr docs, dev logs, wiki
// articles, and API endpoints. See docs/backend/search.md.

// `?docs?` matches the `(docs)` route group. Vite treats escaped parentheses
// differently in dev and build, so the pattern avoids them.
const docModules = import.meta.glob<{ metadata: DocMeta }>(
	['/src/routes/+page.svx', '/src/routes/?docs?/**/+page.svx'],
	{
		eager: true
	}
);

// Raw sources, for the section headings each docs page adds to the index.
const docSources = import.meta.glob<string>(
	['/src/routes/+page.svx', '/src/routes/?docs?/**/+page.svx'],
	{
		eager: true,
		query: '?raw',
		import: 'default'
	}
);

// `?articles?` matches the `(articles)` route group. Vite treats escaped
// parentheses differently in dev and build, so the pattern avoids them.
const devLogModules = import.meta.glob<{ metadata: DevLogMeta }>(
	'/src/routes/?articles?/dev-logs/**/+page.svx',
	{ eager: true }
);

const wikiModules = import.meta.glob<{ metadata: WikiMeta }>(
	'/src/routes/?articles?/wiki/**/+page.svx',
	{ eager: true }
);

export const GET: RequestHandler = async () => {
	const docMetas = Object.entries(docModules).map(([path, module]) => ({
		...docIndexEntry(path, module.metadata),
		source: docSources[path]
	}));
	const docTitles = new Map(docMetas.map((doc) => [doc.slug, doc.title]));
	const docs = docMetas.flatMap((doc) => {
		const parentTitle = doc.parent ? docTitles.get(doc.parent) : undefined;
		return [
			buildDocEntry(doc, parentTitle),
			...buildDocSectionEntries(doc, doc.source, parentTitle)
		];
	});

	const devLogs = Object.entries(devLogModules).map(([path, module]) =>
		buildDevLogEntry({ ...module.metadata, slug: path.split('/').at(-2)! })
	);

	const wiki = Object.entries(wikiModules).map(([path, module]) =>
		buildWikiEntry({ ...module.metadata, slug: path.split('/').at(-2)! })
	);

	const spec = await loadApiSpec();
	const entries = applyRatings([...docs, ...devLogs, ...wiki, ...buildApiEndpointEntries(spec)]);

	return new Response(JSON.stringify(entries), {
		headers: { 'Content-Type': 'application/json' }
	});
};

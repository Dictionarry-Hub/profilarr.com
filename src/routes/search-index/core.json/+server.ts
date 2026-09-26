import type { RequestHandler } from './$types';
import type { DevLogMeta, DocMeta, WikiMeta } from '$lib/shared/utils/llm/index.js';
import { buildApiEndpointEntries } from '$lib/shared/utils/search/api.js';
import { buildDevLogEntry } from '$lib/shared/utils/search/devlog.js';
import { buildDocEntry } from '$lib/shared/utils/search/docs.js';
import { docSlugFromPath } from '$lib/shared/utils/llm/docs.js';
import { buildWikiEntry } from '$lib/shared/utils/search/wiki.js';
import { applyRatings } from '$lib/shared/utils/search/ratings.js';
import { loadApiSpec } from '$lib/shared/utils/openapi/index.js';

export const prerender = true;

// Database-independent search entries: Profilarr docs, dev logs, wiki
// articles, and API endpoints. See docs/backend/search.md.

const docModules = import.meta.glob<{ metadata: DocMeta }>('/src/routes/docs/**/+page.svx', {
	eager: true
});

const devLogModules = import.meta.glob<{ metadata: DevLogMeta }>(
	'/src/routes/dev-logs/**/+page.svx',
	{ eager: true }
);

const wikiModules = import.meta.glob<{ metadata: WikiMeta }>('/src/routes/wiki/**/+page.svx', {
	eager: true
});

export const GET: RequestHandler = async () => {
	const docMetas = Object.entries(docModules).map(([path, module]) => ({
		...module.metadata,
		slug: docSlugFromPath(path)
	}));
	const docTitles = new Map(docMetas.map((doc) => [doc.slug, doc.title]));
	const docs = docMetas.map((doc) =>
		buildDocEntry(doc, doc.parent ? docTitles.get(doc.parent) : undefined)
	);

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

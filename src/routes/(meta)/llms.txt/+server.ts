import type { RequestHandler } from './$types';
import { llmsTxt } from '$lib/shared/utils/llm/llms.js';
import {
	docIndexEntry,
	type DevLogMeta,
	type DocMeta,
	type WikiMeta
} from '$lib/shared/utils/llm/index.js';
import type { CompiledDatabase } from '$lib/types/pcd';

// Plain text so the Markdown footer hook leaves it alone: this is the index
// the footer points to.
export const prerender = true;

// `?docs?` matches the `(docs)` route group. Vite treats escaped parentheses
// differently in dev and build, so the pattern avoids them.
const docModules = import.meta.glob<{ metadata: DocMeta }>(
	['/src/routes/+page.svx', '/src/routes/?docs?/**/+page.svx'],
	{
		eager: true
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
const databases = import.meta.glob<CompiledDatabase>(
	['/src/lib/data/pcd/*.json', '!**/index.json'],
	{ eager: true, import: 'default' }
);

function newestFirst<T extends { metadata: { created?: string } }>(
	modules: Record<string, T>
): (T['metadata'] & { slug: string })[] {
	return Object.entries(modules)
		.map(([path, module]) => ({ ...module.metadata, slug: path.split('/').at(-2)! }))
		.sort((a, b) => new Date(b.created ?? 0).getTime() - new Date(a.created ?? 0).getTime());
}

export const GET: RequestHandler = () => {
	const body = llmsTxt({
		docs: Object.entries(docModules).map(([path, module]) =>
			docIndexEntry(path, module.metadata)
		),
		devLogs: newestFirst(devLogModules),
		wiki: newestFirst(wikiModules),
		databases: Object.values(databases)
	});
	return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

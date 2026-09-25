import type { RequestHandler } from './$types';
import { llmsTxt } from '$lib/shared/utils/llm/llms.js';
import type { DevLogMeta, WikiMeta } from '$lib/shared/utils/llm/index.js';
import type { CompiledDatabase } from '$lib/types/pcd';

// Plain text so the Markdown footer hook leaves it alone: this is the index
// the footer points to.
export const prerender = true;

const devLogModules = import.meta.glob<{ metadata: DevLogMeta }>(
	'/src/routes/dev-logs/**/+page.svx',
	{ eager: true }
);
const wikiModules = import.meta.glob<{ metadata: WikiMeta }>('/src/routes/wiki/**/+page.svx', {
	eager: true
});
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
		devLogs: newestFirst(devLogModules),
		wiki: newestFirst(wikiModules),
		databases: Object.values(databases)
	});
	return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

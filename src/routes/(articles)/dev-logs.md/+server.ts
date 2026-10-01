import type { RequestHandler } from './$types';
import { devLogIndexToMarkdown, type DevLogMeta } from '$lib/shared/utils/llm/index.js';

export const prerender = true;

// `?articles?` matches the `(articles)` route group. Vite treats escaped
// parentheses differently in dev and build, so the pattern avoids them.
const modules = import.meta.glob<{ metadata: DevLogMeta }>(
	'/src/routes/?articles?/dev-logs/**/+page.svx',
	{ eager: true }
);

export const GET: RequestHandler = () => {
	const logs = Object.entries(modules)
		.map(([path, module]) => ({
			...module.metadata,
			slug: path.split('/').at(-2)!
		}))
		.sort((a, b) => new Date(b.created ?? 0).getTime() - new Date(a.created ?? 0).getTime());

	return new Response(devLogIndexToMarkdown(logs), {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
	});
};

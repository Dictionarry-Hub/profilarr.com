import type { WikiMeta } from '$lib/shared/utils/llm/index.js';

// `?articles?` matches the `(articles)` route group. Vite treats escaped
// parentheses differently in dev and build, so the pattern avoids them.
const modules = import.meta.glob<{ metadata: WikiMeta }>(
	'/src/routes/?articles?/wiki/**/+page.svx',
	{ eager: true }
);

export function load() {
	const articles = Object.entries(modules)
		.map(([path, module]) => ({
			title: module.metadata.title,
			blurb: module.metadata.blurb ?? '',
			created: module.metadata.created ?? '',
			slug: path.split('/').at(-2)!
		}))
		.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

	return { articles };
}

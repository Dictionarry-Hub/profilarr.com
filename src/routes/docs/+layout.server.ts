import type { LayoutServerLoad } from './$types';
import { docNext, docSlugFromPath, type DocMeta } from '$lib/shared/utils/llm/docs.js';

// Resolves the current page's `next` frontmatter into links for the page
// footer. The load reads the URL, so each prerendered page carries only its
// own links rather than every page's.

const modules = import.meta.glob<{ metadata: DocMeta }>('/src/routes/docs/**/+page.svx', {
	eager: true
});

const docs = Object.entries(modules).map(([path, module]) => ({
	...module.metadata,
	slug: docSlugFromPath(path)
}));

export const load: LayoutServerLoad = ({ url }) => {
	const slug = url.pathname.replace(/^\/docs\/?/, '').replace(/\/$/, '');
	const doc = docs.find((entry) => entry.slug === slug);

	return { docNext: doc ? docNext(doc, docs) : [] };
};

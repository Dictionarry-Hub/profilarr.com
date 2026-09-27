import type { LayoutServerLoad } from './$types';
import { docNext } from '$lib/shared/utils/llm/docs.js';
import { docSource, docsIndex, findDoc } from '$lib/server/docs';

// Resolves the current page's `next` frontmatter into links for the page
// footer, and its edit link and last-updated date. The load reads the URL, so
// each prerendered page carries only its own data rather than every page's.
// The home page does the same in src/routes/+page.server.ts.
export const load: LayoutServerLoad = ({ url }) => {
	const slug = url.pathname.replace(/^\/docs\/?/, '').replace(/\/$/, '');
	const doc = slug === '' ? undefined : findDoc(slug);
	if (!doc) return { docNext: [] };

	return {
		docNext: docNext(doc, docsIndex),
		docSource: docSource(slug)
	};
};

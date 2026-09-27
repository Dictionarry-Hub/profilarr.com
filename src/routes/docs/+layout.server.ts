import type { LayoutServerLoad } from './$types';
import { docNext } from '$lib/shared/utils/llm/docs.js';
import { docsIndex, findDoc } from '$lib/server/docs';

// Resolves the current page's `next` frontmatter into links for the page
// footer. The load reads the URL, so each prerendered page carries only its
// own links rather than every page's. The home page does the same in
// src/routes/+page.server.ts.
export const load: LayoutServerLoad = ({ url }) => {
	const slug = url.pathname.replace(/^\/docs\/?/, '').replace(/\/$/, '');
	const doc = slug === '' ? undefined : findDoc(slug);

	return { docNext: doc ? docNext(doc, docsIndex) : [] };
};

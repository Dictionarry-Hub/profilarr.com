import type { PageServerLoad } from './$types';
import { docNext } from '$lib/shared/utils/llm/docs.js';
import { docSource, docsIndex, findDoc } from '$lib/server/docs';

// The home page is the docs root page (+page.svx). Its `next` links, edit link,
// and last-updated date are resolved here, since it sits outside
// src/routes/docs/+layout.server.ts.
export const load: PageServerLoad = () => ({
	docNext: docNext(findDoc('')!, docsIndex),
	docSource: docSource('')
});

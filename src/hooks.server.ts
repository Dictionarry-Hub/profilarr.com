import type { Handle } from '@sveltejs/kit';
import { absoluteLinks, withIndexFooter } from '$lib/shared/utils/llm/md.js';
import { SITE_URL } from '$lib/shared/utils/llm/site.js';

// Every Markdown artifact gets full URLs for its site-relative links and ends
// with a link to /llms.txt. Doing it here covers every .md route, current and
// future, including during prerender, where both are baked into the static
// files.
export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	if (!response.headers.get('content-type')?.startsWith('text/markdown')) return response;

	const headers = new Headers(response.headers);
	headers.delete('content-length');
	const markdown = absoluteLinks(await response.text(), SITE_URL);
	return new Response(withIndexFooter(markdown, SITE_URL), {
		status: response.status,
		headers
	});
};

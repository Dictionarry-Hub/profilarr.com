import { redirect } from '@sveltejs/kit';

// The docs root page moved to the site root, where it is the home page. The
// prerendered redirect keeps old /docs links working.
export const prerender = true;

export function load() {
	redirect(308, '/');
}

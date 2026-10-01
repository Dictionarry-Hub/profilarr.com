import type { RequestHandler } from './$types';
import { SITE_URL } from '$lib/shared/utils/llm/site.js';
import { renderSitemap, sitemapEntries, type ArticleLike } from '$lib/shared/utils/seo/sitemap.js';
import { docSlugFromPath } from '$lib/shared/utils/llm/docs.js';

export const prerender = true;

// `?docs?` matches the `(docs)` route group. Vite treats escaped parentheses
// differently in dev and build, so the pattern avoids them.
const docModules = import.meta.glob(['/src/routes/+page.svx', '/src/routes/?docs?/**/+page.svx']);

// `?articles?` matches the `(articles)` route group. Vite treats escaped
// parentheses differently in dev and build, so the pattern avoids them.
const devLogModules = import.meta.glob<{ metadata: { created: string } }>(
	'/src/routes/?articles?/dev-logs/**/+page.svx',
	{ eager: true }
);

const wikiModules = import.meta.glob<{ metadata: { created: string } }>(
	'/src/routes/?articles?/wiki/**/+page.svx',
	{ eager: true }
);

function articles(modules: Record<string, { metadata: { created: string } }>): ArticleLike[] {
	return Object.entries(modules).map(([path, module]) => ({
		slug: path.split('/').at(-2)!,
		created: String(module.metadata.created)
	}));
}

export const GET: RequestHandler = () => {
	const xml = renderSitemap(
		SITE_URL,
		sitemapEntries(
			articles(devLogModules),
			articles(wikiModules),
			Object.keys(docModules).map(docSlugFromPath)
		)
	);
	return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

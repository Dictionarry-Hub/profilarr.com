// Which pages search engines may index. Every page is, except in the PCD
// browser, where only quality profile detail pages are. The SEO component
// marks the rest `noindex` and the sitemap leaves them out, both through this
// check. See docs/frontend/seo.md#indexing.

const INDEXED_PCD_PAGE = /^\/pcd\/[^/]+\/quality-profiles\/[^/]+$/;

export function isIndexable(pathname: string): boolean {
	if (pathname !== '/pcd' && !pathname.startsWith('/pcd/')) return true;
	return INDEXED_PCD_PAGE.test(pathname);
}

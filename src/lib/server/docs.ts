import { docSlugFromPath, type DocIndexEntry, type DocMeta } from '$lib/shared/utils/llm/docs.js';

// Every docs page's metadata: the root page, which is the site's home page,
// and the pages under /docs. Used to resolve `next` links and build mirrors.

const modules = import.meta.glob<{ metadata: DocMeta }>(
	['/src/routes/+page.svx', '/src/routes/docs/**/+page.svx'],
	{ eager: true }
);

export const docsIndex: DocIndexEntry[] = Object.entries(modules).map(([path, module]) => ({
	...module.metadata,
	slug: docSlugFromPath(path)
}));

export function findDoc(slug: string): DocIndexEntry | undefined {
	return docsIndex.find((doc) => doc.slug === slug);
}

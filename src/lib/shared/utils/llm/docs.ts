import { SITE_URL } from './site.js';
import { join, articleBody } from './md.js';

// Markdown serializers for Profilarr docs artifacts. Same shape as the wiki
// serializers, minus author and date: docs pages are ordered by `order`, not
// published. See docs/backend/llm.md.

export interface DocMeta {
	title: string;
	blurb?: string;
	order?: number;
	/** Slug of the page this one is listed under in the sidebar. */
	parent?: string;
}

export interface DocIndexEntry extends DocMeta {
	slug: string;
}

export function docToMarkdown(meta: DocMeta, source: string, slug: string): string {
	return join([
		`# ${meta.title}`,
		meta.blurb ? `> ${meta.blurb}` : '',
		`A page from the Profilarr documentation. Web version: ${SITE_URL}/docs/${slug}`,
		articleBody(source)
	]);
}

/** Reading order among siblings: ascending `order`, pages without one last,
    ties by title. */
export function byDocOrder<T extends DocMeta>(a: T, b: T): number {
	const orderA = a.order ?? Number.POSITIVE_INFINITY;
	const orderB = b.order ?? Number.POSITIVE_INFINITY;
	if (orderA !== orderB) return orderA < orderB ? -1 : 1;
	return a.title.localeCompare(b.title);
}

/** Top-level pages in reading order, each with its child pages in reading
    order. One level deep: a child's own children are not collected. Throws
    on an unknown `parent` so a typo fails the build instead of hiding a page. */
export function docTree<T extends DocIndexEntry>(docs: T[]): (T & { children: T[] })[] {
	const slugs = new Set(docs.map((doc) => doc.slug));
	for (const doc of docs) {
		if (doc.parent && !slugs.has(doc.parent)) {
			throw new Error(`Docs page "${doc.slug}" has unknown parent "${doc.parent}"`);
		}
	}

	return docs
		.filter((doc) => !doc.parent)
		.sort(byDocOrder)
		.map((doc) => ({
			...doc,
			children: docs.filter((child) => child.parent === doc.slug).sort(byDocOrder)
		}));
}

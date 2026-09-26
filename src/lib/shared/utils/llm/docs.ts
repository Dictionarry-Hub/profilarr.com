import { SITE_URL } from './site.js';
import { join, articleBody } from './md.js';

// Markdown serializers for Profilarr docs artifacts. Same shape as the wiki
// serializers, minus author and date: docs pages are ordered by `order`, not
// published. See docs/backend/llm.md.

export interface DocMeta {
	title: string;
	blurb?: string;
	order?: number;
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

/** Reading order: ascending `order`, pages without one last, ties by title. */
export function byDocOrder<T extends DocMeta>(a: T, b: T): number {
	const orderA = a.order ?? Number.POSITIVE_INFINITY;
	const orderB = b.order ?? Number.POSITIVE_INFINITY;
	if (orderA !== orderB) return orderA < orderB ? -1 : 1;
	return a.title.localeCompare(b.title);
}

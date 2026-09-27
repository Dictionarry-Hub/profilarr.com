import { SITE_URL } from './site.js';
import { join, articleBody } from './md.js';
import { componentsToMarkdown, mediaToMarkdown } from './components.js';

// Markdown serializers for Profilarr docs artifacts. Same shape as the wiki
// serializers, minus author and date: docs pages are ordered by `order`, not
// published. See docs/backend/llm.md.

export interface DocMeta {
	title: string;
	blurb?: string;
	order?: number;
	/** Slug of the page this one is listed under in the sidebar. */
	parent?: string;
	/** Extra search terms that don't appear in the title, blurb, or headings. */
	keywords?: string[];
	/** Pages to point readers at next, in the page footer: docs slugs, or links
	    to other pages on the site. */
	next?: (string | DocLink)[];
}

export interface DocIndexEntry extends DocMeta {
	slug: string;
}

/** A page another page points at, resolved from its frontmatter. */
export interface DocLink {
	title: string;
	blurb?: string;
	href: string;
}

/** Slug of a docs page from the path of any file in its route directory, such
    as `+page.svx` or `data.ts`: the directory name under `src/routes/docs/`, or
    '' for the root page, which is the site's home page at `src/routes/`. */
export function docSlugFromPath(path: string): string {
	return path.replace(/^\/src\/routes\/(docs\/)?/, '').replace(/\/?[^/]+$/, '');
}

/** Web path of a docs page: `/` for the root page, `/docs/{slug}` otherwise. */
export function docPath(slug: string): string {
	return slug === '' ? '/' : `/docs/${slug}`;
}

/** Path of a docs page's Markdown mirror: `/index.md` for the root page. */
export function docMarkdownPath(slug: string): string {
	return slug === '' ? '/index.md' : `${docPath(slug)}.md`;
}

/** Title with its parent's in front ("Test: Custom Formats"), so child pages
    that share a title stay distinct in search results and browser tabs. */
export function docFullTitle(title: string, parentTitle?: string): string {
	return parentTitle ? `${parentTitle}: ${title}` : title;
}

/** `data` is the page's data.ts module, used to serialize the components the
    page embeds. Pages without one pass nothing. `next` is the page's resolved
    `next` frontmatter (see docNext), listed at the end like the page footer. */
export function docToMarkdown(
	meta: DocMeta,
	source: string,
	slug: string,
	data: Record<string, unknown> = {},
	next: DocLink[] = []
): string {
	return join([
		`# ${meta.title}`,
		meta.blurb ? `> ${meta.blurb}` : '',
		`A page from the Profilarr documentation. Web version: ${SITE_URL}${docPath(slug)}`,
		mediaToMarkdown(componentsToMarkdown(articleBody(source), data)),
		next.length > 0 ? '## Next' : '',
		next
			.map((link) => `- [${link.title}](${link.href})${link.blurb ? `: ${link.blurb}` : ''}`)
			.join('\n')
	]);
}

/** Resolves a page's `next` entries to links, in the order given. A slug names
    a docs page, and child pages get their parent's title in front, as in
    search results. A link to another page on the site, such as the database
    browser, passes through as written. Throws on an unknown slug or a link
    that leaves the site, so a typo fails the build instead of dropping a
    link. */
export function docNext(doc: DocIndexEntry, docs: DocIndexEntry[]): DocLink[] {
	return (doc.next ?? []).map((entry) => {
		if (typeof entry !== 'string') {
			if (!entry.title || !entry.href?.startsWith('/')) {
				throw new Error(
					`Docs page "${doc.slug || 'home'}" has a next link without a title or a site-relative href`
				);
			}
			return { title: entry.title, blurb: entry.blurb, href: entry.href };
		}

		const slug = entry;
		const target = docs.find((candidate) => candidate.slug === slug);
		if (!target) {
			throw new Error(`Docs page "${doc.slug || 'home'}" has unknown next page "${slug}"`);
		}
		const parent = docs.find((candidate) => candidate.slug === target.parent);
		return {
			title: docFullTitle(target.title, parent?.title),
			blurb: target.blurb,
			href: docPath(target.slug)
		};
	});
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

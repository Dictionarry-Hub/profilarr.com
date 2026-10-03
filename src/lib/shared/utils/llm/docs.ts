import { SITE_URL } from './site.js';
import { join, articleBody, isoDate } from './md.js';
import { componentsToMarkdown, mediaToMarkdown } from './components.js';

// Markdown serializers for Profilarr docs artifacts. Same shape as the wiki
// serializers, minus author and date: docs pages are ordered by `order`, not
// published. See docs/backend/llm.md.

export interface DocMeta {
	title: string;
	/** GitHub profile URL of the page's author, or a list of them. */
	author?: string | string[];
	blurb?: string;
	order?: number;
	/** Extra search terms that don't appear in the title, blurb, or headings. */
	keywords?: string[];
	/** Pages to point readers at next, in the page footer: docs slugs, or links
	    to other pages on the site. */
	next?: (string | DocLink)[];
	/** On a page with child pages: what the pages in its group cover. Opens the
	    group's Markdown (see docGroupToMarkdown). */
	groupDescription?: string;
}

export interface DocIndexEntry extends DocMeta {
	slug: string;
	/** Slug of the page this one is listed under, from its route: the slug
	    minus its last segment. */
	parent?: string;
}

/** A page another page points at, resolved from its frontmatter. */
export interface DocLink {
	title: string;
	blurb?: string;
	href: string;
}

/** Slug of a docs page from the path of any file in its route directory, such
    as `+page.svx` or `data.ts`: the directory path under the `(docs)` route
    group (`installation/docker`), or '' for the root page, which is the site's
    home page at `src/routes/`. */
export function docSlugFromPath(path: string): string {
	return path.replace(/^\/src\/routes\/(\(docs\)\/)?/, '').replace(/\/?[^/]+$/, '');
}

/** Slug of the page a docs page is listed under: its slug minus the last
    segment, or undefined for a top-level page. */
export function docParentSlug(slug: string): string | undefined {
	const end = slug.lastIndexOf('/');
	return end === -1 ? undefined : slug.slice(0, end);
}

/** A docs page's index entry from its source path and frontmatter. */
export function docIndexEntry<T extends DocMeta>(
	path: string,
	meta: T
): T & Pick<DocIndexEntry, 'slug' | 'parent'> {
	const slug = docSlugFromPath(path);
	const parent = docParentSlug(slug);
	return { ...meta, slug, ...(parent ? { parent } : {}) };
}

/** Web path of a docs page: `/` for the root page, `/{slug}` otherwise. The
    `(docs)` route group adds nothing to the URL. */
export function docPath(slug: string): string {
	return `/${slug}`;
}

/** Repository path of a docs page's source file. */
export function docSourcePath(slug: string): string {
	return slug === '' ? 'src/routes/+page.svx' : `src/routes/(docs)/${slug}/+page.svx`;
}

const REPO_URL = 'https://github.com/Dictionarry-Hub/profilarr.com';

/** GitHub editor link for a docs page's source file. */
export function docEditUrl(slug: string): string {
	return `${REPO_URL}/edit/develop/${docSourcePath(slug)}`;
}

/** Where a docs page's source lives: its GitHub edit link, and the date and
    link of the last commit that changed it when the build has git history. */
export interface DocSource {
	editUrl: string;
	updated?: string;
	commitUrl?: string;
}

/** GitHub link to a commit in this site's repository. */
export function commitUrl(hash: string): string {
	return `${REPO_URL}/commit/${hash}`;
}

/** Path of a docs page's Markdown mirror: `/index.md` for the root page. */
export function docMarkdownPath(slug: string): string {
	return slug === '' ? '/index.md' : `${docPath(slug)}.md`;
}

/** Path of a group's Markdown, a page and every page under it in one file:
    the page's mirror path with `.group` before the extension. */
export function docGroupMarkdownPath(slug: string): string {
	return docMarkdownPath(slug).replace(/\.md$/, '.group.md');
}

/** Title with its parent's in front ("Test: Custom Formats"), so child pages
    that share a title stay distinct in search results and browser tabs. */
export function docFullTitle(title: string, parentTitle?: string): string {
	return parentTitle ? `${parentTitle}: ${title}` : title;
}

/** One link in a MoreInfo row. */
export interface MoreInfoLink {
	label: string;
	href: string;
}

/** Resolves MoreInfo's `pages` attribute: comma-separated docs slugs, each
    with an optional `#anchor` and an optional `: label` shown instead of the
    page title, as in `installation/docker, installation#the-parser: The parser`. Links
    use the page's own title; pages that share a title (Build and Test both
    have Custom Formats) need a label. Throws on an unknown slug so a typo
    fails the build instead of dropping a link. */
export function moreInfoLinks(pages: string, docs: DocIndexEntry[]): MoreInfoLink[] {
	return pages
		.split(',')
		.map((entry) => entry.trim())
		.filter(Boolean)
		.map((entry) => {
			const [target, ...labelParts] = entry.split(':');
			const label = labelParts.join(':').trim();
			const [slug, anchor] = target.trim().split('#');
			const doc = docs.find((candidate) => candidate.slug === slug);
			if (!doc) throw new Error(`MoreInfo links to unknown docs page "${slug}"`);
			return {
				label: label || doc.title,
				href: `${docPath(slug)}${anchor ? `#${anchor}` : ''}`
			};
		});
}

/** Replaces MoreInfo tags with a line of links. */
export function moreInfoToMarkdown(body: string, docs: DocIndexEntry[]): string {
	return body.replace(/<MoreInfo\s+pages="([^"]*)"\s*\/>/g, (_, pages: string) => {
		const links = moreInfoLinks(pages, docs).map((link) => `[${link.label}](${link.href})`);
		return `More info: ${links.join(', ')}`;
	});
}

/** `data` is the page's data.ts module, used to serialize the components the
    page embeds. Pages without one pass nothing. `next` is the page's resolved
    `next` frontmatter (see docNext), listed at the end like the page footer.
    `docs` is every docs page, which MoreInfo links resolve against.
    `updated` and `commitUrl` are the page's last commit, when the build has
    git history. */
export function docToMarkdown(
	meta: DocMeta,
	source: string,
	slug: string,
	data: Record<string, unknown> = {},
	next: DocLink[] = [],
	docs: DocIndexEntry[] = [],
	{ updated, commitUrl }: Pick<DocSource, 'updated' | 'commitUrl'> = {}
): string {
	const authors = meta.author ? [meta.author].flat() : [];
	const by = authors.length > 0 ? ` by ${authors.join(', ')}` : '';
	const commit = commitUrl ? ` (commit: ${commitUrl})` : '';
	const lastUpdated = updated ? `, last updated ${isoDate(updated)}${commit}` : '';
	return join([
		`# ${meta.title}`,
		meta.blurb ? `> ${meta.blurb}` : '',
		`A page from the Profilarr documentation${by}${lastUpdated}. Web version: ${SITE_URL}${docPath(slug)}. Edit on GitHub: ${docEditUrl(slug)}`,
		moreInfoToMarkdown(mediaToMarkdown(componentsToMarkdown(articleBody(source), data)), docs),
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

/** A docs page with its child pages, which carry their own children. */
export type DocNode<T> = T & { children: DocNode<T>[] };

/** A page in the root layout's sidebar data. */
export interface DocNavNode {
	title: string;
	slug: string;
	children: DocNavNode[];
}

/** Every page in the sidebar data as a flat list, each with `parent` set from
    where it sits in the tree. */
export function docNavEntries(nodes: DocNavNode[], parent?: string): DocIndexEntry[] {
	return nodes.flatMap((node) => [
		{ title: node.title, slug: node.slug, ...(parent ? { parent } : {}) },
		...docNavEntries(node.children, node.slug)
	]);
}

/** Top-level pages in reading order, each with its child pages in reading
    order, nested as deep as `parent` goes. Throws when a page's parent route
    has no page of its own, so the page is not left out of the tree. */
export function docTree<T extends DocIndexEntry>(docs: T[]): DocNode<T>[] {
	const slugs = new Set(docs.map((doc) => doc.slug));
	for (const doc of docs) {
		if (doc.parent && !slugs.has(doc.parent)) {
			throw new Error(`Docs page "${doc.slug}" has unknown parent "${doc.parent}"`);
		}
	}

	const childrenOf = (parent: string | undefined): DocNode<T>[] =>
		docs
			.filter((doc) => (doc.parent || undefined) === parent)
			.sort(byDocOrder)
			.map((doc) => ({ ...doc, children: childrenOf(doc.slug) }));

	return childrenOf(undefined);
}

/** Whether a page heads a group: a page with child pages, or the root page,
    which heads every other page. */
export function docHasGroup(slug: string, docs: DocIndexEntry[]): boolean {
	return docs.some((doc) => (slug === '' ? doc.slug !== '' : doc.parent === slug));
}

/** A page that heads a group, with the pages under it nested in reading
    order. The root page's child pages are the top-level pages. Returns
    undefined for a page without child pages. */
export function docGroup<T extends DocIndexEntry>(slug: string, docs: T[]): DocNode<T> | undefined {
	const tree = docTree(docs.filter((doc) => doc.slug !== ''));

	if (slug === '') {
		const root = docs.find((doc) => doc.slug === '');
		return root && tree.length > 0 ? { ...root, children: tree } : undefined;
	}

	const find = (nodes: DocNode<T>[]): DocNode<T> | undefined => {
		for (const node of nodes) {
			const found = node.slug === slug ? node : find(node.children);
			if (found) return found;
		}
		return undefined;
	};

	const group = find(tree);
	return group && group.children.length > 0 ? group : undefined;
}

/** Stands in for a group description that isn't written yet. */
const GROUP_DESCRIPTION_TODO = '#todo';

/** A group's Markdown: the page that heads it and every page under it, in one
    file. It opens with the group's title, its `groupDescription`, and a
    contents list linking each page's own mirror. The pages follow in reading
    order, each parent before its child pages, separated by rules. `page`
    returns one page's Markdown and prints the title it is given: pages under
    the header get their parent's title in front, as in search results, since
    titles repeat across sections. */
export function docGroupToMarkdown<T extends DocIndexEntry>(
	group: DocNode<T>,
	page: (doc: T) => string
): string {
	const contents: string[] = [];
	const pages: string[] = [];
	const add = (doc: DocNode<T>, indent: string, parent?: DocNode<T>) => {
		contents.push(`${indent}- [${doc.title}](${docMarkdownPath(doc.slug)})`);
		// The root page is no page's parent, so its title goes in front of none.
		const parentTitle = doc.parent === undefined ? undefined : parent?.title;
		pages.push(page({ ...doc, title: docFullTitle(doc.title, parentTitle) }));
		for (const child of doc.children) add(child, `${indent}  `, doc);
	};
	add(group, '');

	const description = group.groupDescription?.trim();
	const scope =
		group.slug === ''
			? 'The Profilarr documentation'
			: `The ${group.title} section of the Profilarr documentation`;

	return join([
		`# ${group.title}`,
		description && description !== GROUP_DESCRIPTION_TODO ? `> ${description}` : '',
		`${scope}, ${pages.length} pages in reading order. Web version: ${SITE_URL}${docPath(group.slug)}`,
		contents.join('\n'),
		...pages.flatMap((markdown) => ['---', markdown])
	]);
}

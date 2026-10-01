import type { PcdNavIndex } from '$lib/types/pcd';
import {
	docIndexEntry,
	docPath,
	docTree,
	type DocIndexEntry,
	type DocMeta,
	type DocNode
} from '$lib/shared/utils/llm/docs.js';

export const prerender = true;

interface ArticleMeta {
	title: string;
	slug: string;
	created: string;
}

function articleNav(files: Record<string, { metadata: ArticleMeta }>, base: string) {
	return Object.entries(files)
		.map(([path, module]) => {
			const slug = path.split('/').at(-2)!;
			return {
				title: module.metadata.title,
				href: `${base}/${slug}`,
				created: module.metadata.created
			};
		})
		.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
}

interface DocNavEntry {
	title: string;
	slug: string;
	href: string;
	children: DocNavEntry[];
}

function docNavEntry(doc: DocNode<DocIndexEntry>): DocNavEntry {
	return {
		title: doc.title,
		slug: doc.slug,
		href: docPath(doc.slug),
		children: doc.children.map(docNavEntry)
	};
}

// Docs follow reading order, not publish date, and nest under the page whose
// route contains theirs. The root page is the home page and the Home header's
// link, not an entry.
function docsNav(files: Record<string, { metadata: DocMeta }>) {
	const docs = Object.entries(files)
		.map(([path, module]) => docIndexEntry(path, module.metadata))
		.filter((doc) => doc.slug !== '');

	return docTree(docs).map(docNavEntry);
}

export async function load() {
	// `?docs?` matches the `(docs)` route group. Vite treats escaped parentheses
	// differently in dev and build, so the pattern avoids them.
	const docFiles = import.meta.glob<{ metadata: DocMeta }>(
		['/src/routes/+page.svx', '/src/routes/?docs?/**/+page.svx'],
		{
			eager: true
		}
	);
	// `?articles?` matches the `(articles)` route group. Vite treats escaped
	// parentheses differently in dev and build, so the pattern avoids them.
	const devLogFiles = import.meta.glob<{ metadata: ArticleMeta }>(
		'/src/routes/?articles?/dev-logs/**/+page.svx',
		{ eager: true }
	);
	const wikiFiles = import.meta.glob<{ metadata: ArticleMeta }>(
		'/src/routes/?articles?/wiki/**/+page.svx',
		{ eager: true }
	);

	const docs = docsNav(docFiles);
	const devLogs = articleNav(devLogFiles, '/dev-logs');
	const wiki = articleNav(wikiFiles, '/wiki');

	// Which databases have compiled data. The entity names themselves are
	// fetched per database at view time (see /pcd/[database]/nav.json), so
	// 4,500 prerendered pages do not each carry the full index.
	const pcdNavFiles = import.meta.glob<{ default: PcdNavIndex }>('/src/lib/data/pcd/index.json', {
		eager: true
	});
	const pcdDatabases = Object.keys(Object.values(pcdNavFiles)[0]?.default ?? {});

	return { docs, devLogs, wiki, pcdDatabases };
}

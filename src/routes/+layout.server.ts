import type { PcdNavIndex } from '$lib/types/pcd';
import { docPath, docSlugFromPath, docTree, type DocMeta } from '$lib/shared/utils/llm/docs.js';

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

// Docs follow reading order, not publish date, and nest one level under a
// `parent` page. The root page is the home page and the Home header's link,
// not an entry.
function docsNav(files: Record<string, { metadata: DocMeta }>) {
	const docs = Object.entries(files)
		.map(([path, module]) => ({ ...module.metadata, slug: docSlugFromPath(path) }))
		.filter((doc) => doc.slug !== '');

	return docTree(docs).map((doc) => ({
		title: doc.title,
		slug: doc.slug,
		href: docPath(doc.slug),
		children: doc.children.map((child) => ({
			title: child.title,
			slug: child.slug,
			href: docPath(child.slug)
		}))
	}));
}

export async function load() {
	const docFiles = import.meta.glob<{ metadata: DocMeta }>(
		['/src/routes/+page.svx', '/src/routes/docs/**/+page.svx'],
		{
			eager: true
		}
	);
	const devLogFiles = import.meta.glob<{ metadata: ArticleMeta }>(
		'/src/routes/dev-logs/**/+page.svx',
		{ eager: true }
	);
	const wikiFiles = import.meta.glob<{ metadata: ArticleMeta }>('/src/routes/wiki/**/+page.svx', {
		eager: true
	});

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

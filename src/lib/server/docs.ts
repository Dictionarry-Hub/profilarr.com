import {
	commitUrl,
	docEditUrl,
	docIndexEntry,
	docSourcePath,
	type DocIndexEntry,
	type DocMeta,
	type DocSource
} from '$lib/shared/utils/llm/docs.js';
import { lastCommit } from './git';

// Every docs page's metadata: the root page, which is the site's home page,
// and the pages in the (docs) route group. Used to resolve `next` links and
// build mirrors.

// `?docs?` matches the `(docs)` route group. Vite treats escaped parentheses
// differently in dev and build, so the pattern avoids them.
const modules = import.meta.glob<{ metadata: DocMeta }>(
	['/src/routes/+page.svx', '/src/routes/?docs?/**/+page.svx'],
	{ eager: true }
);

export const docsIndex: DocIndexEntry[] = Object.entries(modules).map(([path, module]) =>
	docIndexEntry(path, module.metadata)
);

export function findDoc(slug: string): DocIndexEntry | undefined {
	return docsIndex.find((doc) => doc.slug === slug);
}

export function docSource(slug: string): DocSource {
	const commit = lastCommit(docSourcePath(slug));
	return {
		editUrl: docEditUrl(slug),
		updated: commit?.date,
		commitUrl: commit && commitUrl(commit.hash)
	};
}

import { docFullTitle, docPath, type DocIndexEntry } from '../llm/docs.js';
import { articleBody } from '../llm/md.js';
import { BASELINE_ELO, type SearchEntry } from './types.js';

const DOC_KEYWORDS = ['docs', 'documentation'];

/** `parentTitle` is the title of the page `doc` is listed under, if any. */
export function buildDocEntry(doc: DocIndexEntry, parentTitle?: string): SearchEntry {
	return {
		title: docFullTitle(doc.title, parentTitle),
		url: docPath(doc.slug),
		type: 'doc',
		blurb: doc.blurb ?? '',
		keywords: [...(doc.keywords ?? []), ...DOC_KEYWORDS],
		elo: BASELINE_ELO
	};
}

export interface DocHeading {
	level: 2 | 3;
	text: string;
	/** Heading id on the rendered page, as rehype-slug assigns it. */
	anchor: string;
}

/** The `##` and `###` headings of an mdsvex source, outside fenced code and
    script blocks, with the anchors rehype-slug gives them. rehype-slug uses
    github-slugger: lowercase, drop punctuation, one hyphen per space, and a
    numeric suffix on repeats. */
export function docHeadings(source: string): DocHeading[] {
	const seen = new Map<string, number>();
	const headings: DocHeading[] = [];
	let inFence = false;

	for (const line of articleBody(source).split('\n')) {
		if (line.trimStart().startsWith('```')) {
			inFence = !inFence;
			continue;
		}
		const match = inFence ? null : line.match(/^(#{2,3})\s+(.+?)\s*$/);
		if (!match) continue;

		const text = match[2].replace(/`/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
		const base = text
			.toLowerCase()
			.replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
			.replace(/ /g, '-');
		const count = seen.get(base) ?? 0;
		seen.set(base, count + 1);

		headings.push({
			level: match[1].length === 2 ? 2 : 3,
			text,
			anchor: count === 0 ? base : `${base}-${count}`
		});
	}

	return headings;
}

/** One search entry per section heading, linking straight to it, so terms
    that only appear in a section heading (such as Unraid on the Docker page)
    are findable. Body text is still not indexed. */
export function buildDocSectionEntries(
	doc: DocIndexEntry,
	source: string,
	parentTitle?: string
): SearchEntry[] {
	const pageTitle = docFullTitle(doc.title, parentTitle);
	let section = '';

	return docHeadings(source).map((heading) => {
		if (heading.level === 2) section = heading.text;
		const where = heading.level === 3 && section ? `${section}, in ${pageTitle}` : pageTitle;
		return {
			title: `${doc.title}: ${heading.text}`,
			url: `${docPath(doc.slug)}#${heading.anchor}`,
			type: 'doc',
			blurb: `Section of ${where}`,
			keywords: DOC_KEYWORDS,
			elo: BASELINE_ELO
		};
	});
}

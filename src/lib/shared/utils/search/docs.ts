import { docFullTitle, docPath, type DocIndexEntry } from '../llm/docs.js';
import { BASELINE_ELO, type SearchEntry } from './types.js';

/** `parentTitle` is the title of the page `doc` is listed under, if any. */
export function buildDocEntry(doc: DocIndexEntry, parentTitle?: string): SearchEntry {
	return {
		title: docFullTitle(doc.title, parentTitle),
		url: docPath(doc.slug),
		type: 'doc',
		blurb: doc.blurb ?? '',
		keywords: ['docs', 'documentation'],
		elo: BASELINE_ELO
	};
}

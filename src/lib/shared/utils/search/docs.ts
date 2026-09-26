import { docPath, type DocIndexEntry } from '../llm/docs.js';
import { BASELINE_ELO, type SearchEntry } from './types.js';

export function buildDocEntry(doc: DocIndexEntry): SearchEntry {
	return {
		title: doc.title,
		url: docPath(doc.slug),
		type: 'doc',
		blurb: doc.blurb ?? '',
		keywords: ['docs', 'documentation'],
		elo: BASELINE_ELO
	};
}

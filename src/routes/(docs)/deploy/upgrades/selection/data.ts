import type { MarkdownColumn } from '$lib/shared/utils/llm/components.js';

type SelectorInfo = {
	selector: string;
	searches: string;
};

export const selectors: SelectorInfo[] = [
	{
		selector: 'Random',
		searches: 'Picks matching items randomly.'
	},
	{
		selector: 'Oldest',
		searches: 'Items added to Radarr or Sonarr earliest, not the oldest movies or shows.'
	},
	{
		selector: 'Newest',
		searches: 'Items added to Radarr or Sonarr most recently, not the newest movies or shows.'
	},
	{
		selector: 'Lowest Score',
		searches:
			'Movies whose file has the lowest custom format score. For Sonarr, series with the lowest average score across all their episode files. Items without files count as 0.'
	},
	{
		selector: 'Size (Largest First)',
		searches:
			'Items using the most disk space. For a movie, that is its file; for a series, all its episode files together. Zero or unknown sizes go last.'
	},
	{
		selector: 'Size (Smallest First)',
		searches:
			'Items using the least disk space. For a movie, that is its file; for a series, all its episode files together. Zero or unknown sizes go last.'
	},
	{
		selector: 'Most Popular',
		searches:
			'Movies with the highest TMDb popularity score. Sonarr has no popularity value, so this leaves series in their existing order.'
	},
	{
		selector: 'Least Popular',
		searches:
			'Movies with the lowest TMDb popularity score. Sonarr has no popularity value, so this leaves series in their existing order.'
	},
	{
		selector: 'A-Z',
		searches:
			'Titles in alphabetical order, ignoring leading punctuation and the words The, A, and An.'
	},
	{
		selector: 'Z-A',
		searches:
			'Titles in reverse alphabetical order, ignoring leading punctuation and the words The, A, and An.'
	}
];

export const selectorColumns: MarkdownColumn<SelectorInfo>[] = [
	{ key: 'selector', header: 'Selector', markdown: (row) => `**${row.selector}**` },
	{ key: 'searches', header: 'Searches first' }
];

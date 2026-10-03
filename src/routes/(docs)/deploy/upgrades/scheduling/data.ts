import type { MarkdownColumn } from '$lib/shared/utils/llm/components.js';

type FilterMode = {
	mode: string;
	order: string;
};

export const filterModes: FilterMode[] = [
	{ mode: 'Round Robin', order: 'Takes turns in list order.' },
	{ mode: 'Random Shuffle', order: 'Takes turns in a random order.' }
];

export const filterModeColumns: MarkdownColumn<FilterMode>[] = [
	{ key: 'mode', header: 'Mode', markdown: (row) => `**${row.mode}**` },
	{ key: 'order', header: 'Filter order' }
];

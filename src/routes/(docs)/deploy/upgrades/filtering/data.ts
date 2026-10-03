import { Eye, Funnel } from '@lucide/svelte';
import type { MarkdownColumn, Screenshot } from '$lib/shared/utils/llm/components.js';

// Component data for the Filtering page. The page renders it and the Markdown
// mirror serializes it, so both show the same thing.

type FieldKind = {
	kind: string;
	/** As they appear in the operator menu. */
	operators: string[];
	/** An example rule, as the rule row shows it. */
	example: { field: string; operator: string; value: string; unit?: string };
};

// Each kind of field and the operators Profilarr offers for it.
export const fieldKinds: FieldKind[] = [
	{
		kind: 'Boolean',
		operators: ['is', 'is not'],
		example: { field: 'Cutoff Met', operator: 'is', value: 'False' }
	},
	{
		kind: 'Number',
		operators: ['=', '≠', '>', '≥', '<', '≤'],
		example: { field: 'Runtime', operator: '>', value: '150' }
	},
	{
		kind: 'Text',
		operators: [
			'contains',
			'does not contain',
			'starts with',
			'ends with',
			'equals',
			'does not equal'
		],
		example: { field: 'Studio', operator: 'contains', value: 'Pixar' }
	},
	{
		kind: 'List',
		operators: ['includes', 'does not include', 'is only', 'has any', 'has none'],
		example: { field: 'Genres', operator: 'has', value: 'Horror' }
	},
	{
		kind: 'Date',
		operators: ['is before', 'is after', 'in the last', 'not in the last'],
		example: { field: 'Date Added', operator: 'not in last', value: '365', unit: 'days' }
	},
	{
		kind: 'Status',
		operators: ['is exactly', 'is not', 'has reached', "hasn't passed", 'is past', 'is before'],
		example: { field: 'Status', operator: 'has reached', value: 'Released' }
	}
];

export const fieldKindColumns: MarkdownColumn<FieldKind>[] = [
	{ key: 'kind', header: 'Field holds' },
	{
		key: 'operators',
		header: 'Operators',
		markdown: (row) => row.operators.map((op) => `*${op}*`).join(', ')
	},
	{
		key: 'example',
		header: 'Example',
		markdown: ({ example: e }) =>
			`**${e.field}** *${e.operator}* <u>${e.value}</u>${e.unit ? ` ${e.unit}` : ''}`
	}
];

// The Example's first guess at "popular", and what its preview matches.
export const firstGuessScreens: Screenshot[] = [
	{
		label: 'Filter',
		icon: Funnel,
		alt: 'A Profilarr filter named High Priority Popular with its group on Any (OR) and two rules: Popularity at least 30, and TMDb Rating at least 7',
		caption: 'The group is on Any (OR), so a movie only needs to match one of the two rules.',
		light: '/images/docs_upgrades_filtering_first_filter[style=light].png',
		dark: '/images/docs_upgrades_filtering_first_filter[style=dark].png',
		border: true
	},
	{
		label: 'Preview',
		icon: Eye,
		alt: "The filter's preview: 12 items checked and 11 matched, with The Shawshank Redemption (1994) marked Will search next, followed by movies like The Dark Knight, Dune: Part Two, and Oppenheimer",
		caption: '11 of the 12 movies match, The Shawshank Redemption among them.',
		light: '/images/docs_upgrades_filtering_first_preview[style=light].png',
		dark: '/images/docs_upgrades_filtering_first_preview[style=dark].png',
		border: true
	}
];

// The same filter with Year added to its Any (OR) group, and its preview.
export const yearScreens: Screenshot[] = [
	{
		label: 'Filter',
		icon: Funnel,
		alt: 'The High Priority Popular filter with its group on Any (OR) and three rules: Popularity at least 30, TMDb Rating at least 7, and Year 2020 or later',
		caption: 'Year joins the group, on Any (OR) like the other two.',
		light: '/images/docs_upgrades_filtering_year_filter[style=light].png',
		dark: '/images/docs_upgrades_filtering_year_filter[style=dark].png',
		border: true
	},
	{
		label: 'Preview',
		icon: Eye,
		alt: "The filter's preview: 12 items checked and all 12 matched, with The Shawshank Redemption (1994) marked Will search next and 100% Wolf (2020) now in the list",
		caption: 'All 12 movies match now, and Shawshank is still there.',
		light: '/images/docs_upgrades_filtering_year_preview[style=light].png',
		dark: '/images/docs_upgrades_filtering_year_preview[style=dark].png',
		border: true
	}
];

// The finished filter, and its preview.
export const finalScreens: Screenshot[] = [
	{
		label: 'Filter',
		icon: Funnel,
		alt: 'The High Priority Popular filter with its top group on All (AND): Year 2020 or later, Monitored is True, and a nested group on Any (OR) with Popularity at least 30 and TMDb Rating at least 7',
		caption:
			'The top group is on All (AND), so a movie has to match Year, Monitored, and the nested group, which only needs one of its two rules.',
		light: '/images/docs_upgrades_filtering_final_filter[style=light].png',
		dark: '/images/docs_upgrades_filtering_final_filter[style=dark].png',
		border: true
	},
	{
		label: 'Preview',
		icon: Eye,
		alt: "The filter's preview: 12 items checked and 4 matched, The Menu, Oppenheimer, Dune: Part Two, and Everything Everywhere All at Once, while The Shawshank Redemption and the other older movies don't match because their year is below 2020",
		caption: '4 of the 12 movies match, and Shawshank is out because its year is below 2020.',
		light: '/images/docs_upgrades_filtering_final_preview[style=light].png',
		dark: '/images/docs_upgrades_filtering_final_preview[style=dark].png',
		border: true
	}
];

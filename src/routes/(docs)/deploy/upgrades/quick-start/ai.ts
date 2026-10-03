import type { CodeExample } from '$lib/shared/utils/llm/components.js';
import { DESCRIPTION_PLACEHOLDER } from '$lib/shared/utils/llm/prompt.js';
import { sharedFields, radarrFields, sonarrFields } from '../fields/data';
import { selectors } from '../selection/data';

// Snapshot of Profilarr's shared/upgrades/filters.ts and selectors.ts.
// Keep these IDs, operators, and limits in sync when Profilarr changes.
// Field and selector explanations reuse the authored documentation.
const operatorSets = {
	boolean: { operators: ['is', 'is_not'], value: 'boolean' },
	text: {
		operators: ['contains', 'not_contains', 'starts_with', 'ends_with', 'eq', 'neq'],
		value: 'string'
	},
	exact: {
		operators: ['eq', 'neq'],
		value: 'string; use an exact existing name or listed value'
	},
	number: { operators: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'], value: 'number' },
	status: {
		operators: ['eq', 'neq', 'gte', 'lte', 'gt', 'lt'],
		value: 'one of the listed status strings; comparisons follow their listed order'
	},
	list: {
		operators: ['includes', 'does_not_include', 'is_only', 'has_any', 'has_none'],
		value: 'a single string for includes, does_not_include, or is_only; null for has_any or has_none'
	},
	date: {
		operators: ['before', 'after', 'in_last', 'not_in_last'],
		value: 'an ISO date string for before or after; a number of days for in_last or not_in_last'
	}
};

function field(
	docs: { field: string; checks: string }[],
	id: string,
	label: string,
	kind: keyof typeof operatorSets,
	values?: string[]
) {
	const doc = docs.find((entry) => entry.field === label);
	if (!doc) throw new Error(`Missing upgrade field description: ${label}`);
	return {
		id,
		label,
		description: doc.checks,
		...operatorSets[kind],
		...(values ? { values } : {})
	};
}

export const upgradeFieldCatalog = {
	shared: [
		field(sharedFields, 'monitored', 'Monitored', 'boolean'),
		field(sharedFields, 'cutoff_met', 'Cutoff Met', 'boolean'),
		field(sharedFields, 'title', 'Title', 'text'),
		field(sharedFields, 'quality_profile', 'Quality Profile', 'exact'),
		field(sharedFields, 'original_language', 'Original Language', 'exact'),
		field(sharedFields, 'genres', 'Genres', 'list'),
		field(sharedFields, 'tags', 'Tags', 'list'),
		field(sharedFields, 'rating', 'Rating', 'number'),
		field(sharedFields, 'year', 'Year', 'number'),
		field(sharedFields, 'runtime', 'Runtime', 'number'),
		field(sharedFields, 'size_on_disk', 'Size on Disk', 'number'),
		field(sharedFields, 'date_added', 'Date Added', 'date')
	],
	radarr: [
		field(radarrFields, 'status', 'Status', 'status', [
			'tba',
			'announced',
			'inCinemas',
			'released'
		]),
		field(radarrFields, 'minimum_availability', 'Minimum Availability', 'status', [
			'tba',
			'announced',
			'inCinemas',
			'released'
		]),
		field(radarrFields, 'collection', 'Collection', 'text'),
		field(radarrFields, 'studio', 'Studio', 'text'),
		field(radarrFields, 'keywords', 'Keywords', 'text'),
		field(radarrFields, 'release_group', 'Release Group', 'exact'),
		field(radarrFields, 'custom_format', 'Custom Format', 'list'),
		field(radarrFields, 'popularity', 'Popularity', 'number'),
		field(radarrFields, 'tmdb_rating', 'TMDb Rating', 'number'),
		field(radarrFields, 'imdb_rating', 'IMDb Rating', 'number'),
		field(radarrFields, 'tomato_rating', 'Rotten Tomatoes', 'number'),
		field(radarrFields, 'trakt_rating', 'Trakt Rating', 'number'),
		field(radarrFields, 'digital_release', 'Digital Release', 'date'),
		field(radarrFields, 'physical_release', 'Physical Release', 'date')
	],
	sonarr: [
		field(sonarrFields, 'status', 'Status', 'status', [
			'upcoming',
			'continuing',
			'ended',
			'deleted'
		]),
		field(sonarrFields, 'network', 'Network', 'exact'),
		field(sonarrFields, 'series_type', 'Series Type', 'exact', ['standard', 'daily', 'anime']),
		field(sonarrFields, 'certification', 'Certification', 'exact'),
		field(sonarrFields, 'season_count', 'Season Count', 'number'),
		field(sonarrFields, 'episode_count', 'Episode Count', 'number'),
		field(sonarrFields, 'episode_file_count', 'Episode File Count', 'number'),
		field(sonarrFields, 'first_aired', 'First Aired', 'date'),
		field(sonarrFields, 'last_aired', 'Last Aired', 'date')
	]
};

const selectorIds = [
	'random',
	'oldest',
	'newest',
	'lowest_score',
	'size_desc',
	'size_asc',
	'most_popular',
	'least_popular',
	'alphabetical_asc',
	'alphabetical_desc'
];

// Labels identify authored descriptions; their order does not determine IDs.
const selectorLabels = [
	'Random',
	'Oldest',
	'Newest',
	'Lowest Score',
	'Size (Largest First)',
	'Size (Smallest First)',
	'Most Popular',
	'Least Popular',
	'A-Z',
	'Z-A'
];

const selectorCatalog = selectorIds.map((id, index) => {
	const doc = selectors.find((entry) => entry.selector === selectorLabels[index]);
	if (!doc) throw new Error(`Missing upgrade selector description: ${id}`);
	return { id, label: doc.selector, description: doc.searches };
});

const fields = Object.values(upgradeFieldCatalog).flat();
const filterSchema = {
	type: 'object',
	additionalProperties: false,
	required: ['name', 'enabled', 'group', 'selector', 'count', 'cutoff'],
	properties: {
		name: { type: 'string', minLength: 1 },
		enabled: { type: 'boolean' },
		group: { $ref: '#/$defs/group' },
		selector: { type: 'string', enum: selectorIds },
		count: { type: 'integer', minimum: 1, maximum: 10 },
		cutoff: { type: 'number', minimum: 0, maximum: 100 },
		tag: { type: 'string' }
	},
	$defs: {
		group: {
			type: 'object',
			additionalProperties: false,
			required: ['type', 'match', 'children'],
			properties: {
				type: { const: 'group' },
				match: { enum: ['all', 'any'] },
				children: {
					type: 'array',
					items: { anyOf: [{ $ref: '#/$defs/rule' }, { $ref: '#/$defs/group' }] }
				}
			}
		},
		rule: {
			type: 'object',
			additionalProperties: false,
			required: ['type', 'field', 'operator', 'value'],
			properties: {
				type: { const: 'rule' },
				field: { type: 'string', enum: [...new Set(fields.map((entry) => entry.id))] },
				operator: {
					type: 'string',
					enum: [...new Set(fields.flatMap((entry) => entry.operators))]
				},
				value: { type: ['string', 'number', 'boolean', 'null'] }
			}
		}
	}
};

const referenceUrls = [
	'https://profilarr.com/deploy/upgrades/filtering.md',
	'https://profilarr.com/deploy/upgrades/fields.md',
	'https://profilarr.com/deploy/upgrades/selection.md',
	'https://profilarr.com/deploy/upgrades/scheduling.md',
	'https://profilarr.com/installation.md'
];

const fieldReference = Object.entries(upgradeFieldCatalog)
	.map(([app, entries]) => `${app}:\n${entries.map((entry) => JSON.stringify(entry)).join('\n')}`)
	.join('\n\n');

export const upgradePrompt: CodeExample = {
	title: 'Profilarr Upgrade Filter Prompt',
	language: 'text',
	code: `Help me build a Profilarr upgrade filter for this goal:

${DESCRIPTION_PLACEHOLDER}

The filter schema and supported fields, operators, and selectors are included below.

Before writing the filter, ask about anything I haven't specified that you need to know:
- Whether I use Radarr or Sonarr.
- Which library items I want to target.
- Which items I want searched first.
- How many items to search per run and how often to run upgrades.
- Profilarr's timezone if I want searches at a particular time of day.

Only ask questions my description hasn't already answered. Explain unfamiliar settings briefly, and suggest suitable options when I'm unsure. Ask for exact profile, custom format, release group, or tag names when a rule needs them. If my goal isn't supported by the available fields, explain that rather than inventing a field.

Distinguish Profilarr's search limits from my indexer allowance. Give the maximum movie or series searches per day, without calling the schedule gentle or safe.

Describe each field literally. Don't treat Date Added as the last download date, or file size and custom format matches as proof of file quality.

Label thresholds and preferences you choose as assumptions. If I delegate those choices, choose reasonable defaults and explain them briefly.

Ask missing questions in small batches. Keep the final explanation concise, followed by the JSON and separate scheduling settings.

Once we've agreed on the setup:
1. Explain what the filter matches and how it selects items.
2. Provide one importable filter JSON object without comments, using the supplied schema and field catalog. Do not include an id or app type in the JSON.
3. Give the schedule and mode separately, since they aren't part of the filter import.
4. Tell me to use + > Import, paste the JSON, and preview the imported filter to check that it matches what I intended before saving.

## Filter JSON Schema

This schema specifies the JSON shape. The field catalog below specifies app compatibility, field-specific operators, and value types. Follow BOTH when constructing rules. Use shared fields plus only the chosen app's fields. Use null only for the has_any and has_none operators.

${JSON.stringify(filterSchema, null, 2)}

## Field Catalog

Each entry gives the exact field ID, its label, what it checks, allowed operator IDs, and the rule's value type. Listed values are case-sensitive. For name-based fields, use the names from my Arr instance, not numeric IDs. Lists take one string per rule, not arrays; combine several rules with an all or any group. Date comparisons use ISO dates; relative date rules use a number of days.

${fieldReference}

## Selectors

Use each selector's id in the JSON, not its label.

${selectorCatalog.map((entry) => JSON.stringify(entry)).join('\n')}

## Counts, Schedules, and Modes

- Radarr searches movies. Runs must be at least 10 minutes apart, with up to 10 searches per hour and no more than 10 movies in one run.
- Sonarr searches a whole series, including every season. Count is 1 and runs must be at least 60 minutes apart; a less frequent schedule is allowed.
- For regular Radarr intervals: hourly allows count 10; every 30 minutes allows 5; every 15 minutes allows 2; every 10 minutes allows 1. Less frequent runs still allow at most 10 per run.
- Count must fit the schedule. For regular schedules, maxCount = min(maxPerHour, floor(maxPerHour / runsPerHour)), with a minimum of 1; obey the minimum interval separately. For unusual schedules, consult the Scheduling reference rather than averaging away tightly spaced runs.
- Schedule, mode, and the instance's enabled setting are configured outside the imported filter. Schedules use Profilarr's TZ environment variable, which defaults to UTC.
- Standard five-field cron examples: 0 * * * * (hourly), */30 * * * * (every 30 minutes), 0 */6 * * * (every six hours), 0 3 * * * (daily at 03:00 in Profilarr's timezone).
- With several enabled filters, one filter runs per scheduled run. Round Robin (round_robin) uses list order; Random Shuffle (random) uses random order. Both are intended to work through each enabled filter before repeating one. Round Robin is suitable when no other mode is requested.
- cutoff defaults to 100. It is the percentage of the profile's Upgrade Until Custom Format Score used by cutoff_met, not a quality-tier cutoff or a score rule that applies automatically to every filter. Include a cutoff_met rule if the goal requires it.
- Omit tag unless I need a custom cooldown tag. Profilarr otherwise derives it from the filter's name. It skips tagged items until all matches have been searched, then clears the tag and starts again. Sharing a tag shares the cooldown between filters.
- Profilarr asks the Arr to search; the Arr's quality profile and other settings decide whether a release is eligible to grab. A filter does not override them.

## Further Reading

These Markdown references explain the settings in more detail. If you cannot fetch them, use the schema, catalog, and constraints included in this prompt; do not assume you read the linked pages.

${referenceUrls.join('\n')}`
};

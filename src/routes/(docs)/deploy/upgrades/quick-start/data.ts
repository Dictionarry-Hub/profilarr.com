import type { Column } from '$lib/client/ui/table/types';

export { upgradePrompt } from './ai';

type FilterExample = {
	title: string;
	description: string;
	language: string;
	code: string;
};

// The page and its Markdown mirror use the same importable filter JSON.
export const exampleFilters: FilterExample[] = [
	{
		title: 'Below Target (Radarr)',
		description:
			"After changing profiles, focus on monitored, released movies below their profile's custom format score target. Searches up to ten movies per run, starting with the lowest scores. This checks the score target, not the quality cutoff.",
		language: 'json',
		code: `{
  "name": "Below Target",
  "enabled": true,
  "group": {
    "type": "group",
    "match": "all",
    "children": [
      {
        "type": "rule",
        "field": "monitored",
        "operator": "is",
        "value": true
      },
      {
        "type": "rule",
        "field": "status",
        "operator": "eq",
        "value": "released"
      },
      {
        "type": "rule",
        "field": "cutoff_met",
        "operator": "is",
        "value": false
      }
    ]
  },
  "selector": "lowest_score",
  "count": 10,
  "cutoff": 100
}`
	},
	{
		title: 'Banned Groups (Radarr)',
		description:
			'Replace files from groups you no longer want, especially after adding an indexer with better alternatives. Searches up to ten monitored, released movies matching the Banned Groups custom format, starting with the lowest scores. Change the format name if yours is different.',
		language: 'json',
		code: `{
  "name": "Banned Groups",
  "enabled": true,
  "group": {
    "type": "group",
    "match": "all",
    "children": [
      {
        "type": "rule",
        "field": "monitored",
        "operator": "is",
        "value": true
      },
      {
        "type": "rule",
        "field": "status",
        "operator": "eq",
        "value": "released"
      },
      {
        "type": "rule",
        "field": "custom_format",
        "operator": "includes",
        "value": "Banned Groups"
      }
    ]
  },
  "selector": "lowest_score",
  "count": 10,
  "cutoff": 100
}`
	},
	{
		title: 'Favourites (Radarr)',
		description:
			'Give the movies you care about their own upgrade filter. Searches up to ten random monitored, released movies tagged favourites. Add that tag in Radarr or change the rule to a tag you already use.',
		language: 'json',
		code: `{
  "name": "Favourites",
  "enabled": true,
  "group": {
    "type": "group",
    "match": "all",
    "children": [
      {
        "type": "rule",
        "field": "monitored",
        "operator": "is",
        "value": true
      },
      {
        "type": "rule",
        "field": "status",
        "operator": "eq",
        "value": "released"
      },
      {
        "type": "rule",
        "field": "tags",
        "operator": "includes",
        "value": "favourites"
      }
    ]
  },
  "selector": "random",
  "count": 10,
  "cutoff": 100
}`
	},
	{
		title: 'Finished Shows (Sonarr)',
		description:
			'Revisit completed shows when better releases or season packs become available. Searches one monitored, ended series per run, starting with the lowest average custom format score. Sonarr searches the whole series.',
		language: 'json',
		code: `{
  "name": "Finished Shows",
  "enabled": true,
  "group": {
    "type": "group",
    "match": "all",
    "children": [
      {
        "type": "rule",
        "field": "monitored",
        "operator": "is",
        "value": true
      },
      {
        "type": "rule",
        "field": "status",
        "operator": "eq",
        "value": "ended"
      }
    ]
  },
  "selector": "lowest_score",
  "count": 1,
  "cutoff": 100
}`
	}
];

export const exampleFilterColumns: Column<FilterExample>[] = [
	{ key: 'title', header: 'Filter' },
	{ key: 'description', header: 'What It Does' },
	{ key: 'code', header: 'Actions', align: 'right' }
];

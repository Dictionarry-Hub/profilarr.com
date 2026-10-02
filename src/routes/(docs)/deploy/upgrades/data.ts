import { Eye, Film, Funnel, RotateCcwClock } from '@lucide/svelte';
import type { MarkdownColumn, Screenshot } from '$lib/shared/utils/llm/components.js';

// Component data for the Upgrades page. The page renders it and the Markdown
// mirror serializes it, so both show the same thing.

// The Dark Knight in Radarr, with the nikt0 encode it grabbed in 2018.
export const radarrScreens: Screenshot[] = [
	{
		label: 'Movie',
		icon: Film,
		alt: "The Dark Knight's page in Radarr, with one 6.6 GiB file: a Bluray-1080p x264 encode from the release group nikt0",
		caption: 'The nikt0 encode is the only file Radarr has for the movie.',
		light: '/images/docs_upgrades_radarr_movie[style=light].png',
		dark: '/images/docs_upgrades_radarr_movie[style=dark].png',
		border: true
	},
	{
		label: 'History',
		icon: RotateCcwClock,
		alt: "The Dark Knight's history in Radarr: The Dark Knight 2008 1080p BluRay x264-nikt0 grabbed on Oct 9 2018 at 9:42pm and imported three minutes later",
		caption: 'Radarr grabbed and imported it in October 2018.',
		light: '/images/docs_upgrades_radarr_history[style=light].png',
		dark: '/images/docs_upgrades_radarr_history[style=dark].png',
		border: true
	}
];

type Concept = {
	concept: string;
	decides: string;
	href: string;
};

// What decides which items an upgrade run searches, each with its own page.
export const concepts: Concept[] = [
	{
		concept: 'Filtering',
		decides: 'Which items qualify.',
		href: '/deploy/upgrades/filtering'
	},
	{
		concept: 'Selection',
		decides: 'Which of them get searched first, and how many each run.',
		href: '/deploy/upgrades/selection'
	},
	{
		concept: 'Scheduling',
		decides: 'When runs happen, and when an item can be searched again.',
		href: '/deploy/upgrades/scheduling'
	}
];

export const conceptColumns: MarkdownColumn<Concept>[] = [
	{
		key: 'concept',
		header: 'Concept',
		markdown: (row) => `[${row.concept}](${row.href})`
	},
	{ key: 'decides', header: 'Decides' }
];

// The filter that catches The Dark Knight, and its preview.
export const profilarrScreens: Screenshot[] = [
	{
		label: 'Filter',
		icon: Funnel,
		alt: "Profilarr's Upgrades page for a Radarr instance, enabled on a monthly schedule in Round Robin mode. Its one filter has a 100% cutoff, the Lowest Score method, a count of 1, and two rules that must all match: Quality Profile is 1080p Quality, and Custom Format has Banned Groups",
		caption:
			'Matches movies on 1080p Quality whose file is from a banned release group, then searches the lowest scoring one each run.',
		light: '/images/docs_upgrades_profilarr_filter[style=light].png',
		dark: '/images/docs_upgrades_profilarr_filter[style=dark].png',
		border: true
	},
	{
		label: 'Preview',
		icon: Eye,
		alt: "Profilarr's preview of the filter: 12 items checked, 1 matched, 1 after cooldown, and Lowest Score picks 1 of 1. The Dark Knight (2008) is marked Will search next, and the other movies don't match because their quality profile is 720p Quality, not 1080p Quality",
		caption: 'Of the 12 movies checked, only The Dark Knight matches, so it gets searched next.',
		light: '/images/docs_upgrades_profilarr_preview[style=light].png',
		dark: '/images/docs_upgrades_profilarr_preview[style=dark].png',
		border: true
	}
];

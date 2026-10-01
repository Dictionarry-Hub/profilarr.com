import type { MarkdownColumn, Screenshot } from '$lib/shared/utils/llm/components.js';

// Component data for the Quality Profile Testing page. The page renders it and
// the Markdown mirror serializes it, so both show the same thing.

type ReleaseSource = {
	method: string;
	description: string;
};

export const releaseSources: ReleaseSource[] = [
	{
		method: 'Import releases',
		description:
			"Runs an interactive search in one of your Arr instances, the same search you'd run from Radarr or Sonarr, and lets you pick which results to keep. Choose the instance and the matching item in its library. For a series, you then choose a season, and Profilarr keeps only the season packs from that search."
	},
	{
		method: 'Add release',
		description:
			"Lets you type one in by hand: a release title, and optionally its size, languages, indexers, and flags. Use it for a release you've seen but can't find in a search right now, or one you've written to test a single format."
	}
];

export const releaseSourceColumns: MarkdownColumn<ReleaseSource>[] = [
	{ key: 'method', header: 'Method' },
	{ key: 'description', header: 'How it works' }
];

export const profileScores: Screenshot[] = [
	{
		label: '1080p Quality HDR',
		alt: 'Blade Runner expanded on the Testing page with the 1080p Quality HDR profile selected, showing four releases of The Final Cut: the DON release at 907,600, the LoRD PROPER release at 885,606, the NCmt release at 883,300, and the hand-added GROUP release at 701,000. Each release is expanded to show its parsed source, resolution, group, edition, and languages, and its matched custom formats with their scores.',
		caption: 'The DON release scores highest against `1080p Quality HDR`.',
		light: '/images/docs_qp_testing_1080p_quality_hdr[style=light].png',
		dark: '/images/docs_qp_testing_1080p_quality_hdr[style=dark].png',
		border: true
	},
	{
		label: '1080p Quality',
		alt: 'The same four Blade Runner releases with the 1080p Quality profile selected: the LoRD PROPER release at 885,606, the NCmt release at 883,300, the hand-added GROUP release at 701,000, and the DON release last at -1,113,398, where HDR and x265 each score -999,999.',
		caption: 'Against `1080p Quality`, HDR and x265 push the same DON release to the bottom.',
		light: '/images/docs_qp_testing_1080p_quality[style=light].png',
		dark: '/images/docs_qp_testing_1080p_quality[style=dark].png',
		border: true
	}
];

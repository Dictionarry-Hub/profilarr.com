import { FlaskConical, Hammer, Send } from '@lucide/svelte';
import type { Screenshot } from '$lib/shared/utils/llm/components.js';

// Component data for the home page. The page renders it and the Markdown
// mirror serializes it, so both show the same thing.

// A tab without `light` and `dark` images shows a placeholder.
export const screenshots: Screenshot[] = [
	{
		label: 'Build',
		icon: Hammer,
		alt: "The 1080p Balanced quality profile's scoring tab in Profilarr, listing custom formats with separate Radarr and Sonarr scores",
		caption: 'A quality profile scores each custom format separately for Radarr and Sonarr.',
		light: '/images/home_build[style=light].png',
		dark: '/images/home_build[style=dark].png',
		border: true
	},
	{
		label: 'Test',
		icon: FlaskConical,
		alt: 'Two release titles tested against the 1080p Quality Tier 1 custom format in Profilarr, one expanded to show the expected and parsed value for each condition',
		caption:
			'Release titles tested against a custom format, with each condition checked against the parsed values.',
		light: '/images/home_test[style=light].png',
		dark: '/images/home_test[style=dark].png',
		border: true
	},
	{
		label: 'Deploy',
		icon: Send,
		alt: 'The sync tab for a Radarr instance in Profilarr, choosing the Dictionarry media management configs and quality profile to sync, each with its trigger',
		caption: 'Each Arr instance picks the configurations it syncs, and when.',
		light: '/images/home_deploy[style=light].png',
		dark: '/images/home_deploy[style=dark].png',
		border: true
	}
];

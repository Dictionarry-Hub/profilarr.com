import { Film, SlidersHorizontal, Tags } from '@lucide/svelte';
import type { CodeExample, Screenshot } from '$lib/shared/utils/llm/components.js';

// Component data for the Quick Start page. The page renders it and the
// Markdown mirror serializes it, so both show the same thing.

// The smallest compose that runs Profilarr. The Docker page has the full one,
// with the parser and reverse proxy settings.
export const install: CodeExample[] = [
	{
		title: 'compose.yml',
		language: 'yaml',
		code: `services:
  profilarr:
    image: ghcr.io/dictionarry-hub/profilarr:latest
    container_name: profilarr
    restart: unless-stopped
    ports:
      - '6868:6868'
    volumes:
      - ./config:/config
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Etc/UTC`
	}
];

// Radarr after a first sync, in its light and dark themes.
export const radarrScreens: Screenshot[] = [
	{
		label: 'Quality Profiles',
		icon: SlidersHorizontal,
		alt: "Radarr's Profiles settings, listing the 720p Quality and 1080p Quality profiles synced from Dictionarry",
		caption: 'The synced profiles appear in Radarr under Settings > Profiles.',
		light: '/images/quickstart_radarr_profiles[style=light].png',
		dark: '/images/quickstart_radarr_profiles[style=dark].png',
		border: true
	},
	{
		label: 'Custom Formats',
		icon: Tags,
		alt: "Radarr's Custom Formats settings, listing the Dictionarry custom formats the synced profiles score, each with its conditions",
		caption: 'Their custom formats come with them, under Settings > Custom Formats.',
		light: '/images/quickstart_radarr_custom_formats[style=light].png',
		dark: '/images/quickstart_radarr_custom_formats[style=dark].png',
		border: true
	},
	{
		label: 'Movie',
		icon: Film,
		alt: "A movie's page in Radarr using the 720p Quality profile, with its file matching the 720p Bluray and 720p Quality Tier 2 custom formats",
		caption: 'Once a movie uses the profile, its file is scored against the custom formats.',
		light: '/images/quickstart_radarr_movie[style=light].png',
		dark: '/images/quickstart_radarr_movie[style=dark].png',
		border: true
	}
];

import { error } from '@sveltejs/kit';
import { renderAbout } from '$lib/shared/utils/pcd/about.js';
import { pcdDatabaseEntries } from '$lib/shared/utils/pcd/prerender.js';
import type { CompiledDatabase } from '$lib/types/pcd';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = pcdDatabaseEntries;

// Database landing page: the repo's ABOUT.md when it publishes one, otherwise
// the manifest description. The section list shows in both cases.
export const load: PageServerLoad = async ({ params }) => {
	let data: CompiledDatabase;
	try {
		const module = await import(`$lib/data/pcd/${params.database}.json`);
		data = module.default as CompiledDatabase;
	} catch {
		error(404, 'Database not found');
	}

	const media = [data.media.radarr, data.media.sonarr];
	const mediaCount = (key: 'naming' | 'settings' | 'qualityDefinitions') =>
		media.reduce((sum, arr) => sum + arr[key].length, 0);
	const section = (label: string, segment: string, count: number) => ({ label, segment, count });

	return {
		id: data.id,
		name: data.name,
		description: data.description,
		version: data.version,
		repo: data.repo,
		arrTypes: data.arrTypes,
		aboutHtml: data.about ? renderAbout(data.about, data.repo, data.branch) : null,
		sections: [
			section('Quality Profiles', 'quality-profiles', data.qualityProfiles.length),
			section('Custom Formats', 'custom-formats', data.customFormats.length),
			section('Regular Expressions', 'regular-expressions', data.regularExpressions.length),
			section('Delay Profiles', 'delay-profiles', data.delayProfiles.length),
			section('Naming', 'naming', mediaCount('naming')),
			section('Media Settings', 'media-settings', mediaCount('settings')),
			section('Quality Definitions', 'quality-definitions', mediaCount('qualityDefinitions'))
		]
	};
};

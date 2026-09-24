import { error } from '@sveltejs/kit';
import { marked } from 'marked';
import { pickDescriptionFallback } from '$lib/shared/utils/pcd/description';
import { pcdNamedEntityEntries } from '$lib/shared/utils/pcd/prerender.js';
import { entityHistory } from '$lib/shared/utils/pcd/history-data';
import { slugify } from '$lib/shared/utils/slug';
import type { CompiledDatabase } from '$lib/types/pcd';
import type { EntryGenerator, PageServerLoad } from './$types';

const NO_DESCRIPTION_MESSAGES = [
	'This quality profile speaks for itself.',
	'No description needed. The scores tell the story.',
	'The qualities are the explanation.',
	'Ranked, scored, and left unexplained.',
	'Description missing. Scores ready.',
	'If you know, you know.',
	'A quality profile of few words.',
	'Read the scores. Trust the upgrade path.',
	'No description found. The profile remains unapologetic.'
] as const;

export const entries: EntryGenerator = () => pcdNamedEntityEntries('qualityProfiles');

export const load: PageServerLoad = async ({ params }) => {
	const { database, slug } = params;

	let data: CompiledDatabase;
	try {
		const module = await import(`$lib/data/pcd/${database}.json`);
		data = module.default as CompiledDatabase;
	} catch {
		error(404, 'Database not found');
	}

	const profile = data.qualityProfiles.find((item) => slugify(item.name) === slug);
	if (!profile) {
		error(404, 'Quality profile not found');
	}

	const descriptionHtml = profile.description ? await marked.parse(profile.description) : null;
	const noDescriptionMessage = descriptionHtml
		? null
		: pickDescriptionFallback(profile.name, NO_DESCRIPTION_MESSAGES);

	return {
		profile: { ...profile, noDescriptionMessage },
		descriptionHtml,
		history: entityHistory(data, 'quality_profile', profile.name)
	};
};

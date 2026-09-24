import { slugify } from '$lib/shared/utils/slug';
import type { CompiledDatabase, ProfileScore, QualityProfile } from '$lib/types/pcd';

export type RegularExpressionReference = {
	name: string;
	slug: string;
	tags: string[];
	[key: string]: unknown;
};

export type QualityProfileReference = {
	name: string;
	slug: string;
	scores: {
		radarr: number | null;
		sonarr: number | null;
	};
	[key: string]: unknown;
};

export type ProfileCustomFormatScore = {
	name: string;
	slug: string | null;
	tags: string[];
	scores: {
		radarr: number | null;
		sonarr: number | null;
	};
	[key: string]: unknown;
};

export function regularExpressionReferences(
	data: CompiledDatabase,
	regularExpressionName: string
): RegularExpressionReference[] {
	return data.customFormats
		.filter((format) =>
			format.conditions.some(
				(condition) =>
					(condition.data.type === 'release_title' ||
						condition.data.type === 'release_group' ||
						condition.data.type === 'edition') &&
					condition.data.regularExpressionName === regularExpressionName
			)
		)
		.map((format) => ({
			name: format.name,
			slug: slugify(format.name),
			tags: format.tags
		}));
}

export function customFormatProfileReferences(
	data: CompiledDatabase,
	customFormatName: string
): QualityProfileReference[] {
	return data.qualityProfiles
		.flatMap((profile) => {
			const scoring = profile.scoring.filter(
				(entry) => entry.customFormatName === customFormatName
			);
			const fallback = scoreFor(scoring, 'all');
			const radarr = scoreFor(scoring, 'radarr') ?? fallback;
			const sonarr = scoreFor(scoring, 'sonarr') ?? fallback;

			if (radarr === null && sonarr === null) return [];

			return [
				{
					name: profile.name,
					slug: slugify(profile.name),
					scores: { radarr, sonarr }
				}
			];
		})
		.sort((a, b) => a.name.localeCompare(b.name));
}

export function profileCustomFormatScores(
	data: CompiledDatabase,
	profile: QualityProfile
): ProfileCustomFormatScore[] {
	const names = [...new Set(profile.scoring.map((entry) => entry.customFormatName))];

	return names
		.flatMap((name) => {
			const scoring = profile.scoring.filter((entry) => entry.customFormatName === name);
			const fallback = scoreFor(scoring, 'all');
			const radarr = scoreFor(scoring, 'radarr') ?? fallback;
			const sonarr = scoreFor(scoring, 'sonarr') ?? fallback;

			if (radarr === null && sonarr === null) return [];

			const format = data.customFormats.find((entry) => entry.name === name);
			return [
				{
					name,
					slug: format ? slugify(format.name) : null,
					tags: format?.tags ?? [],
					scores: { radarr, sonarr }
				}
			];
		})
		.sort((a, b) => bestScore(b) - bestScore(a) || a.name.localeCompare(b.name));
}

export type ProfileScoreSortKey = 'radarr' | 'sonarr' | 'name';
export type SortDirection = 'asc' | 'desc';

/**
 * Sorts profile scores for display. Entries missing the sorted score go last
 * in either direction; ties fall back to name order.
 */
export function sortProfileScores<T extends ProfileCustomFormatScore>(
	entries: T[],
	key: ProfileScoreSortKey,
	direction: SortDirection
): T[] {
	const factor = direction === 'asc' ? 1 : -1;
	return [...entries].sort((a, b) => {
		if (key === 'name') return a.name.localeCompare(b.name) * factor;
		const av = a.scores[key];
		const bv = b.scores[key];
		if (av === bv) return a.name.localeCompare(b.name);
		if (av === null) return 1;
		if (bv === null) return -1;
		return (av - bv) * factor;
	});
}

function bestScore(entry: ProfileCustomFormatScore): number {
	return Math.max(entry.scores.radarr ?? -Infinity, entry.scores.sonarr ?? -Infinity);
}

function scoreFor(scoring: ProfileScore[], arrType: string): number | null {
	return scoring.find((entry) => entry.arrType === arrType)?.score ?? null;
}

export function formatProfileScore(score: number): string {
	const formatted = score.toLocaleString('en-US');
	return score > 0 ? `+${formatted}` : formatted;
}

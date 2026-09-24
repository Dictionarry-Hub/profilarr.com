import { describe, expect, it } from 'vitest';
import { customFormatToMarkdown } from '$lib/shared/utils/llm/pcd';
import {
	customFormatProfileReferences,
	formatProfileScore,
	profileCustomFormatScores,
	regularExpressionReferences
} from '$lib/shared/utils/pcd/references';
import type { CompiledDatabase, CustomFormat, ProfileScore, QualityProfile } from '$lib/types/pcd';

function customFormat(name: string, conditions: CustomFormat['conditions'] = []): CustomFormat {
	return {
		name,
		description: null,
		includeInRename: false,
		tags: [],
		conditions,
		tests: []
	};
}

function qualityProfile(name: string, scoring: ProfileScore[]): QualityProfile {
	return {
		name,
		description: null,
		tags: [],
		upgradesAllowed: true,
		minimumCustomFormatScore: 0,
		upgradeUntilScore: 0,
		upgradeScoreIncrement: 1,
		languages: [],
		qualities: [],
		scoring
	};
}

function score(customFormatName: string, arrType: string, value: number): ProfileScore {
	return { customFormatName, arrType, score: value };
}

function database(overrides: Partial<CompiledDatabase> = {}): CompiledDatabase {
	return {
		id: 'example',
		name: 'Example',
		repo: 'example/database',
		branch: 'main',
		version: '1.0.0',
		schemaVersion: '1.0.0',
		description: '',
		arrTypes: ['radarr', 'sonarr'],
		customFormats: [],
		qualityProfiles: [],
		regularExpressions: [],
		delayProfiles: [],
		media: {
			radarr: { naming: [], settings: [], qualityDefinitions: [] },
			sonarr: { naming: [], settings: [], qualityDefinitions: [] }
		},
		...overrides
	};
}

describe('regularExpressionReferences', () => {
	it('finds custom formats through pattern-backed conditions', () => {
		const data = database({
			customFormats: [
				customFormat('Matching Format', [
					{
						name: 'Pattern',
						type: 'release_title',
						arrType: 'all',
						required: true,
						negate: false,
						data: { type: 'release_title', regularExpressionName: 'Target' }
					}
				]),
				customFormat('Other Format')
			]
		});

		expect(regularExpressionReferences(data, 'Target')).toEqual([
			{ name: 'Matching Format', slug: 'matching-format', tags: [] }
		]);
	});
});

describe('customFormatProfileReferences', () => {
	it('resolves fallbacks and app-specific overrides in profile order', () => {
		const data = database({
			qualityProfiles: [
				qualityProfile('Zulu Profile', [score('Target', 'all', 0)]),
				qualityProfile('Alpha Profile', [
					score('Target', 'all', 10),
					score('Target', 'radarr', 20)
				]),
				qualityProfile('Beta Profile', [score('Target', 'sonarr', -5)]),
				qualityProfile('Unrelated Profile', [score('Other', 'all', 100)])
			]
		});

		expect(customFormatProfileReferences(data, 'Target')).toEqual([
			{
				name: 'Alpha Profile',
				slug: 'alpha-profile',
				scores: { radarr: 20, sonarr: 10 }
			},
			{
				name: 'Beta Profile',
				slug: 'beta-profile',
				scores: { radarr: null, sonarr: -5 }
			},
			{
				name: 'Zulu Profile',
				slug: 'zulu-profile',
				scores: { radarr: 0, sonarr: 0 }
			}
		]);
	});

	it('formats signed scores deterministically', () => {
		expect(formatProfileScore(3000)).toBe('+3,000');
		expect(formatProfileScore(-1000)).toBe('-1,000');
		expect(formatProfileScore(0)).toBe('0');
	});
});

describe('profileCustomFormatScores', () => {
	it('resolves fallbacks and orders by the best score', () => {
		const tagged = { ...customFormat('Tagged'), tags: ['Audio'] };
		const profile = qualityProfile('Profile', [
			score('Low', 'all', -50),
			score('Tagged', 'all', 10),
			score('Tagged', 'sonarr', 30),
			score('Radarr Only', 'radarr', 20),
			score('Missing', 'all', 0)
		]);
		const data = database({
			customFormats: [customFormat('Low'), tagged, customFormat('Radarr Only')],
			qualityProfiles: [profile]
		});

		expect(profileCustomFormatScores(data, profile)).toEqual([
			{
				name: 'Tagged',
				slug: 'tagged',
				tags: ['Audio'],
				scores: { radarr: 10, sonarr: 30 }
			},
			{
				name: 'Radarr Only',
				slug: 'radarr-only',
				tags: [],
				scores: { radarr: 20, sonarr: null }
			},
			{
				name: 'Missing',
				slug: null,
				tags: [],
				scores: { radarr: 0, sonarr: 0 }
			},
			{
				name: 'Low',
				slug: 'low',
				tags: [],
				scores: { radarr: -50, sonarr: -50 }
			}
		]);
	});
});

describe('custom format Markdown references', () => {
	it('renders effective profile scores and future detail links', () => {
		const format = customFormat('Target');
		const data = database({
			customFormats: [format],
			qualityProfiles: [
				qualityProfile('Different Scores', [
					score('Target', 'radarr', 3000),
					score('Target', 'sonarr', -1000)
				]),
				qualityProfile('Same Score', [score('Target', 'all', 10)])
			]
		});

		const markdown = customFormatToMarkdown(data, format);

		expect(markdown).toContain(
			'- [Different Scores](https://profilarr.com/pcd/example/quality-profiles/different-scores): Radarr +3,000; Sonarr -1,000'
		);
		expect(markdown).toContain(
			'- [Same Score](https://profilarr.com/pcd/example/quality-profiles/same-score): Radarr and Sonarr +10'
		);
	});

	it('renders an empty reference state', () => {
		const format = customFormat('Target');

		expect(customFormatToMarkdown(database(), format)).toContain(
			'No quality profiles reference this custom format.'
		);
	});
});

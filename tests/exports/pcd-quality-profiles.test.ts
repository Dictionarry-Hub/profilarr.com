import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { qualityProfileToMarkdown } from '$lib/shared/utils/llm/pcd';
import { qualityProfileToYaml } from '$lib/shared/utils/yaml/pcd';
import type { CompiledDatabase, CustomFormat, QualityProfile } from '$lib/types/pcd';

function customFormat(name: string): CustomFormat {
	return {
		name,
		description: null,
		includeInRename: false,
		tags: ['Ignored'],
		conditions: [],
		tests: []
	};
}

const profile: QualityProfile = {
	name: 'Example Profile',
	description: 'An example.',
	tags: ['1080p'],
	upgradesAllowed: false,
	minimumCustomFormatScore: 10,
	upgradeUntilScore: 1000,
	upgradeScoreIncrement: 5,
	languages: [{ name: 'Original', type: 'must' }],
	qualities: [
		{
			position: 0,
			enabled: true,
			upgradeUntil: true,
			quality: null,
			group: { name: 'WEB 1080p', members: ['WEBRip-1080p', 'WEBDL-1080p'] }
		},
		{ position: 1, enabled: false, upgradeUntil: false, quality: 'Remux-2160p', group: null }
	],
	scoring: [
		{ customFormatName: 'Zulu', arrType: 'all', score: 50 },
		{ customFormatName: 'Alpha', arrType: 'radarr', score: -100 },
		{ customFormatName: 'Missing', arrType: 'sonarr', score: 5 }
	]
};

const database: CompiledDatabase = {
	id: 'example',
	name: 'Example',
	repo: 'example/database',
	branch: 'main',
	version: '1.0.0',
	schemaVersion: '1.0.0',
	description: '',
	arrTypes: ['radarr', 'sonarr'],
	customFormats: [customFormat('Alpha'), customFormat('Zulu')],
	qualityProfiles: [profile],
	regularExpressions: [],
	delayProfiles: [],
	media: {
		radarr: { naming: [], settings: [], qualityDefinitions: [] },
		sonarr: { naming: [], settings: [], qualityDefinitions: [] }
	}
};

describe('qualityProfileToYaml', () => {
	const document = parse(qualityProfileToYaml(database, profile));

	it('writes the language name only', () => {
		expect(document.entity_type).toBe('quality_profile');
		expect(document.language).toBe('Original');
	});

	it('keeps every scoring setting, even with upgrades off', () => {
		expect(document.scoring).toMatchObject({
			upgrades_allowed: false,
			minimum_custom_format_score: 10,
			upgrade_until_score: 1000,
			upgrade_score_increment: 5
		});
	});

	it('lists effective scores in name order, linking formats that resolve', () => {
		expect(document.scoring.custom_formats).toEqual([
			{
				name: 'Alpha',
				url: 'https://profilarr.com/pcd/example/custom-formats/alpha',
				radarr: -100,
				sonarr: null
			},
			{ name: 'Missing', radarr: null, sonarr: 5 },
			{
				name: 'Zulu',
				url: 'https://profilarr.com/pcd/example/custom-formats/zulu',
				radarr: 50,
				sonarr: 50
			}
		]);
	});

	it('writes every quality entry with stored positions', () => {
		expect(document.qualities).toEqual([
			{
				position: 0,
				name: 'WEB 1080p',
				type: 'quality_group',
				items: ['WEBRip-1080p', 'WEBDL-1080p'],
				enabled: true,
				upgrade_until: true
			},
			{
				position: 1,
				name: 'Remux-2160p',
				type: 'single_quality',
				items: ['Remux-2160p'],
				enabled: false,
				upgrade_until: false
			}
		]);
	});
});

describe('qualityProfileToMarkdown', () => {
	const markdown = qualityProfileToMarkdown(database, profile);

	it('puts language and tags in the context line', () => {
		expect(markdown).toContain(
			'A quality profile from the Example PCD database. Language: Original. Tags: 1080p. Web version: https://profilarr.com/pcd/example/quality-profiles/example-profile'
		);
	});

	it('explains the settings and drops the upgrade rows when upgrades are off', () => {
		expect(markdown).toContain(
			'| Upgrades Allowed | No | Existing files are never replaced by upgrades. |'
		);
		expect(markdown).toContain(
			'| Minimum Custom Format Score | 10 | A release must score at least 10 to be downloaded. |'
		);
		expect(markdown).not.toContain('Upgrade Until Score');
		expect(markdown).not.toContain('Upgrade Score Increment');
	});

	it('lists scores Radarr first, highest first, with missing scores last', () => {
		const zulu = markdown.indexOf('[Zulu]');
		const alpha = markdown.indexOf('[Alpha]');
		const missing = markdown.indexOf('| Missing |');
		expect(zulu).toBeGreaterThan(-1);
		expect(zulu).toBeLessThan(alpha);
		expect(alpha).toBeLessThan(missing);
		expect(markdown).toContain(
			'| [Alpha](https://profilarr.com/pcd/example/custom-formats/alpha) | -100 | - | Ignored |'
		);
	});

	it('tables the qualities through the last enabled one and lists the rest', () => {
		expect(markdown).toContain('Only one quality group is enabled');
		expect(markdown).toContain('| 1 | WEB 1080p | WEBRip-1080p, WEBDL-1080p | Enabled |');
		expect(markdown).not.toContain('| 2 | Remux-2160p');
		expect(markdown).toContain('Also listed, disabled: Remux-2160p');
		expect(markdown).not.toContain('Upgrades stop at the upgrade-until entry.');
	});
});

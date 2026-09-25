import { describe, expect, it } from 'vitest';
import { llmsTxt } from '$lib/shared/utils/llm/llms';
import { withIndexFooter } from '$lib/shared/utils/llm/md';
import type { CompiledDatabase, QualityProfile } from '$lib/types/pcd';

function qualityProfile(name: string, tags: string[]): QualityProfile {
	return {
		name,
		description: null,
		tags,
		upgradesAllowed: true,
		minimumCustomFormatScore: 0,
		upgradeUntilScore: 0,
		upgradeScoreIncrement: 1,
		languages: [],
		qualities: [],
		scoring: []
	};
}

const database: CompiledDatabase = {
	id: 'example',
	name: 'Example',
	repo: 'example/database',
	branch: 'main',
	version: '1.0.0',
	schemaVersion: '1.0.0',
	description: '',
	arrTypes: ['radarr', 'sonarr'],
	customFormats: [],
	qualityProfiles: [qualityProfile('1080p Balanced', ['1080p']), qualityProfile('Remux', [])],
	regularExpressions: [],
	delayProfiles: [],
	media: {
		radarr: { naming: [], settings: [], qualityDefinitions: [] },
		sonarr: { naming: [], settings: [], qualityDefinitions: [] }
	}
};

describe('llmsTxt', () => {
	const text = llmsTxt({
		devLogs: [{ title: 'Rebirth', slug: 'rebirth', blurb: 'Starting over.' }],
		wiki: [{ title: 'Anatomy of a Profile', slug: 'anatomy-of-a-profile' }],
		databases: [database]
	});

	it('follows the llms.txt shape', () => {
		expect(
			text.startsWith('# Profilarr\n\n> Profilarr is a configuration management platform')
		).toBe(true);
		expect(text).toContain('## API Reference');
		expect(text).toContain('- [Profilarr API v1](https://profilarr.com/api/v1.md): ');
	});

	it('links articles with their blurbs when present', () => {
		expect(text).toContain(
			'- [Rebirth](https://profilarr.com/dev-logs/rebirth.md): Starting over.'
		);
		expect(text).toContain(
			'- [Anatomy of a Profile](https://profilarr.com/wiki/anatomy-of-a-profile.md)\n'
		);
	});

	it('links every quality profile and counts the other entity types', () => {
		expect(text).toContain('### Example');
		expect(text).toContain(
			'- [1080p Balanced](https://profilarr.com/pcd/example/quality-profiles/1080p-balanced.md): 1080p'
		);
		expect(text).toContain(
			'- [Remux](https://profilarr.com/pcd/example/quality-profiles/remux.md)'
		);
		expect(text).toContain('Also 0 custom formats, 0 regular expressions');
	});
});

describe('withIndexFooter', () => {
	it('ends a Markdown page with a link to the index', () => {
		expect(withIndexFooter('# Page\n\nBody.\n\n', 'https://profilarr.com')).toBe(
			"# Page\n\nBody.\n\n---\n\nIndex of this site's Markdown pages: https://profilarr.com/llms.txt\n"
		);
	});
});

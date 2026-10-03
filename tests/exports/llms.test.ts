import { describe, expect, it } from 'vitest';
import { llmsTxt } from '$lib/shared/utils/llm/llms';
import { absoluteLinks, withIndexFooter } from '$lib/shared/utils/llm/md';
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
		docs: [
			{ title: 'Docker', slug: 'installation/docker', parent: 'installation', order: 1 },
			{ title: 'Introduction', slug: 'introduction', blurb: 'What Profilarr is.', order: 1 },
			{ title: 'Installation', slug: 'installation', order: 2 },
			{
				title: 'Reverse Proxies',
				slug: 'installation/reverse-proxy',
				parent: 'installation',
				order: 2
			},
			{
				title: 'Traefik',
				slug: 'installation/reverse-proxy/traefik',
				parent: 'installation/reverse-proxy',
				order: 1
			}
		],
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

	it('says where a section and the whole docs are served as one file', () => {
		expect(text).toContain(
			'`.group.md` appended instead; https://profilarr.com/index.group.md holds every docs page.'
		);
	});

	it('links docs pages in reading order with child pages indented', () => {
		expect(text).toContain(
			'## Docs\n\n' +
				'- [Introduction](https://profilarr.com/introduction.md): What Profilarr is.\n' +
				'- [Installation](https://profilarr.com/installation.md)\n' +
				'  - [Docker](https://profilarr.com/installation/docker.md)\n' +
				'  - [Reverse Proxies](https://profilarr.com/installation/reverse-proxy.md)\n' +
				'    - [Traefik](https://profilarr.com/installation/reverse-proxy/traefik.md)\n'
		);
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

describe('absoluteLinks', () => {
	it('points site-relative links at the site URL and leaves the rest alone', () => {
		const markdown = [
			'See [Docker](/installation/docker), [Parser](#the-parser), and [Deno](https://deno.com).',
			'',
			'```md',
			'[Example](/not/rewritten)',
			'```'
		].join('\n');

		expect(absoluteLinks(markdown, 'https://profilarr.com')).toBe(
			markdown.replace(
				'](/installation/docker)',
				'](https://profilarr.com/installation/docker)'
			)
		);
	});
});

import { describe, expect, it } from 'vitest';
import { buildDocEntry } from '$lib/shared/utils/search/docs';

describe('buildDocEntry', () => {
	it('passes the frontmatter blurb through and tags the entry as docs', () => {
		const entry = buildDocEntry({
			title: 'Quick Start',
			slug: 'quick-start',
			blurb: 'A first Profilarr setup from start to finish.',
			order: 2
		});

		expect(entry).toEqual({
			title: 'Quick Start',
			url: '/docs/quick-start',
			type: 'doc',
			blurb: 'A first Profilarr setup from start to finish.',
			keywords: ['docs', 'documentation'],
			elo: 1500
		});
	});

	it('puts the parent title in front for child pages', () => {
		const entry = buildDocEntry(
			{ title: 'Custom Formats', slug: 'custom-format-testing', parent: 'test' },
			'Test'
		);

		expect(entry.title).toBe('Test: Custom Formats');
	});

	it('tolerates a missing blurb', () => {
		const entry = buildDocEntry({ title: 'Introduction', slug: 'introduction' });

		expect(entry.blurb).toBe('');
	});
});

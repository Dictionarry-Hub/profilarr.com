import { describe, expect, it } from 'vitest';
import { buildDocEntry, buildDocSectionEntries, docHeadings } from '$lib/shared/utils/search/docs';

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
			url: '/quick-start',
			type: 'doc',
			blurb: 'A first Profilarr setup from start to finish.',
			keywords: ['docs', 'documentation'],
			elo: 1500
		});
	});

	it('puts the parent title in front for child pages', () => {
		const entry = buildDocEntry(
			{ title: 'Custom Formats', slug: 'test/custom-formats', parent: 'test' },
			'Test'
		);

		expect(entry.title).toBe('Test: Custom Formats');
	});

	it('adds frontmatter keywords to the search terms', () => {
		const entry = buildDocEntry({
			title: 'Installation',
			slug: 'installation',
			keywords: ['synology']
		});

		expect(entry.keywords).toEqual(['synology', 'docs', 'documentation']);
	});

	it('tolerates a missing blurb', () => {
		const entry = buildDocEntry({ title: 'Introduction', slug: 'introduction' });

		expect(entry.blurb).toBe('');
	});
});

describe('docHeadings', () => {
	it('finds section headings outside code and scripts, with rehype-slug anchors', () => {
		const source = [
			'---',
			'title: Docker',
			'---',
			'<script>',
			'## Not a heading',
			'</script>',
			'## Installing Profilarr',
			'### Running as Non-Root',
			'```md',
			'## Also not a heading',
			'```',
			'## Unraid',
			'## Unraid'
		].join('\n');

		expect(docHeadings(source)).toEqual([
			{ level: 2, text: 'Installing Profilarr', anchor: 'installing-profilarr' },
			{ level: 3, text: 'Running as Non-Root', anchor: 'running-as-non-root' },
			{ level: 2, text: 'Unraid', anchor: 'unraid' },
			{ level: 2, text: 'Unraid', anchor: 'unraid-1' }
		]);
	});
});

describe('buildDocSectionEntries', () => {
	it('links each section and names its parent section for subheadings', () => {
		const entries = buildDocSectionEntries(
			{ title: 'Docker', slug: 'installation/docker', parent: 'installation' },
			'## File Permissions\n\n### Linux Basics',
			'Installation'
		);

		expect(entries.map((entry) => [entry.title, entry.url, entry.blurb])).toEqual([
			[
				'Docker: File Permissions',
				'/installation/docker#file-permissions',
				'Section of Installation: Docker'
			],
			[
				'Docker: Linux Basics',
				'/installation/docker#linux-basics',
				'Section of File Permissions, in Installation: Docker'
			]
		]);
	});
});

import { describe, expect, it } from 'vitest';
import { byDocOrder, docToMarkdown } from '$lib/shared/utils/llm/docs';

describe('docToMarkdown', () => {
	it('builds the preamble from frontmatter and strips it from the body', () => {
		const source = '---\nlayout: docs\ntitle: Introduction\n---\n\nTODO: Covers Profilarr.\n';

		const markdown = docToMarkdown(
			{ title: 'Introduction', blurb: 'What Profilarr is.' },
			source,
			'introduction'
		);

		expect(markdown).toBe(
			'# Introduction\n\n> What Profilarr is.\n\nA page from the Profilarr documentation. Web version: https://profilarr.com/docs/introduction\n\nTODO: Covers Profilarr.'
		);
	});
});

describe('byDocOrder', () => {
	it('sorts by order, puts unordered pages last, and breaks ties by title', () => {
		const docs = [
			{ title: 'Zeta' },
			{ title: 'Quick Start', order: 2 },
			{ title: 'Alpha' },
			{ title: 'Introduction', order: 1 }
		];

		expect(docs.sort(byDocOrder).map((doc) => doc.title)).toEqual([
			'Introduction',
			'Quick Start',
			'Alpha',
			'Zeta'
		]);
	});
});

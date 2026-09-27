import { describe, expect, it } from 'vitest';
import {
	byDocOrder,
	docNext,
	docPath,
	docSlugFromPath,
	docToMarkdown,
	docTree
} from '$lib/shared/utils/llm/docs';

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

describe('docToMarkdown next links', () => {
	it('lists the next pages after the body', () => {
		const markdown = docToMarkdown(
			{ title: 'Introduction' },
			'---\ntitle: Introduction\n---\n\nBody.\n',
			'',
			{},
			[
				{ title: 'Quick Start', blurb: 'A first setup.', href: '/docs/quick-start' },
				{ title: 'FAQ', href: '/docs/faq' }
			]
		);

		expect(
			markdown.endsWith(
				'Body.\n\n## Next\n\n- [Quick Start](/docs/quick-start): A first setup.\n- [FAQ](/docs/faq)'
			)
		).toBe(true);
	});

	it('adds nothing without next links', () => {
		expect(docToMarkdown({ title: 'FAQ' }, 'Body.', 'faq')).not.toContain('## Next');
	});
});

describe('docNext', () => {
	const docs = [
		{ title: 'Introduction', slug: '', next: ['quick-start', 'custom-format-testing'] },
		{ title: 'Quick Start', slug: 'quick-start', blurb: 'A first setup.' },
		{ title: 'Test', slug: 'test' },
		{ title: 'Custom Formats', slug: 'custom-format-testing', parent: 'test' }
	];

	it('resolves slugs in order, with the parent title on child pages', () => {
		expect(docNext(docs[0], docs)).toEqual([
			{ title: 'Quick Start', blurb: 'A first setup.', href: '/docs/quick-start' },
			{ title: 'Test: Custom Formats', blurb: undefined, href: '/docs/custom-format-testing' }
		]);
	});

	it('returns nothing for a page without next', () => {
		expect(docNext(docs[1], docs)).toEqual([]);
	});

	it('throws on an unknown slug', () => {
		const broken = { title: 'FAQ', slug: 'faq', next: ['quikc-start'] };
		expect(() => docNext(broken, [...docs, broken])).toThrow(/"faq".*"quikc-start"/);
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

describe('docTree', () => {
	it('nests child pages under their parent, both in reading order', () => {
		const tree = docTree([
			{ title: 'Docker', slug: 'docker', parent: 'installation', order: 1 },
			{ title: 'Installation', slug: 'installation', order: 2 },
			{ title: 'Reverse Proxy', slug: 'reverse-proxy', parent: 'installation', order: 2 },
			{ title: 'Introduction', slug: 'introduction', order: 1 }
		]);

		const slugs = tree.map((doc) => [doc.slug, doc.children.map((child) => child.slug)]);

		expect(slugs).toEqual([
			['introduction', []],
			['installation', ['docker', 'reverse-proxy']]
		]);
	});

	it('throws on an unknown parent', () => {
		const build = () => docTree([{ title: 'Docker', slug: 'docker', parent: 'instalation' }]);

		expect(build).toThrow('Docs page "docker" has unknown parent "instalation"');
	});
});

describe('docSlugFromPath and docPath', () => {
	it('give the root page an empty slug and the /docs path', () => {
		expect(docSlugFromPath('/src/routes/docs/+page.svx')).toBe('');
		expect(docPath('')).toBe('/docs');
	});

	it('use the route directory name for other pages', () => {
		expect(docSlugFromPath('/src/routes/docs/docker/+page.svx')).toBe('docker');
		expect(docPath('docker')).toBe('/docs/docker');
	});
});

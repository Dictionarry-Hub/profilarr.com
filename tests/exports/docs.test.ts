import { describe, expect, it } from 'vitest';
import {
	byDocOrder,
	docNext,
	moreInfoLinks,
	moreInfoToMarkdown,
	commitUrl,
	docEditUrl,
	docMarkdownPath,
	docGroupMarkdownPath,
	docHasGroup,
	docGroup,
	docGroupToMarkdown,
	docPath,
	docSourcePath,
	docSlugFromPath,
	docParentSlug,
	docIndexEntry,
	docToMarkdown,
	docTree,
	type DocIndexEntry
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
			'# Introduction\n\n> What Profilarr is.\n\nA page from the Profilarr documentation. Web version: https://profilarr.com/introduction. Edit on GitHub: https://github.com/Dictionarry-Hub/profilarr.com/edit/develop/src/routes/(docs)/introduction/+page.svx\n\nTODO: Covers Profilarr.'
		);
	});
});

describe('docToMarkdown preamble', () => {
	it('names the authors, the last commit, and the edit link', () => {
		const markdown = docToMarkdown(
			{ title: 'Installation', author: ['https://github.com/a', 'https://github.com/b'] },
			'Body.',
			'installation',
			{},
			[],
			[],
			{
				updated: '2026-09-27T17:19:25+09:30',
				commitUrl: 'https://github.com/Dictionarry-Hub/profilarr.com/commit/68e8963'
			}
		);

		expect(markdown).toContain(
			'A page from the Profilarr documentation by https://github.com/a, https://github.com/b, last updated 2026-09-27 (commit: https://github.com/Dictionarry-Hub/profilarr.com/commit/68e8963). Web version: https://profilarr.com/installation. Edit on GitHub: https://github.com/Dictionarry-Hub/profilarr.com/edit/develop/src/routes/(docs)/installation/+page.svx'
		);
	});
});

describe('docSourcePath and docEditUrl', () => {
	it('point at the home page source for the root page', () => {
		expect(docSourcePath('')).toBe('src/routes/+page.svx');
		expect(docEditUrl('')).toBe(
			'https://github.com/Dictionarry-Hub/profilarr.com/edit/develop/src/routes/+page.svx'
		);
	});

	it('link commits in the site repository', () => {
		expect(commitUrl('2957228e')).toBe(
			'https://github.com/Dictionarry-Hub/profilarr.com/commit/2957228e'
		);
	});

	it('point at the route directory for other pages', () => {
		expect(docSourcePath('installation/docker')).toBe(
			'src/routes/(docs)/installation/docker/+page.svx'
		);
		expect(docEditUrl('installation/docker')).toBe(
			'https://github.com/Dictionarry-Hub/profilarr.com/edit/develop/src/routes/(docs)/installation/docker/+page.svx'
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
				{ title: 'Quick Start', blurb: 'A first setup.', href: '/quick-start' },
				{ title: 'FAQ', href: '/faq' }
			]
		);

		expect(
			markdown.endsWith(
				'Body.\n\n## Next\n\n- [Quick Start](/quick-start): A first setup.\n- [FAQ](/faq)'
			)
		).toBe(true);
	});

	it('adds nothing without next links', () => {
		expect(docToMarkdown({ title: 'FAQ' }, 'Body.', 'faq')).not.toContain('## Next');
	});
});

describe('docNext', () => {
	const docs = [
		{ title: 'Introduction', slug: '', next: ['quick-start', 'test/custom-formats'] },
		{ title: 'Quick Start', slug: 'quick-start', blurb: 'A first setup.' },
		{ title: 'Test', slug: 'test' },
		{ title: 'Custom Formats', slug: 'test/custom-formats', parent: 'test' }
	];

	it('resolves slugs in order, with the parent title on child pages', () => {
		expect(docNext(docs[0], docs)).toEqual([
			{ title: 'Quick Start', blurb: 'A first setup.', href: '/quick-start' },
			{ title: 'Test: Custom Formats', blurb: undefined, href: '/test/custom-formats' }
		]);
	});

	it('returns nothing for a page without next', () => {
		expect(docNext(docs[1], docs)).toEqual([]);
	});

	it('passes links to other site pages through as written', () => {
		const home = {
			title: 'Profilarr',
			slug: '',
			next: [
				'quick-start',
				{ title: 'Database Browser', href: '/pcd/dictionarry', blurb: 'Every entity.' }
			]
		};

		expect(docNext(home, [...docs, home])).toEqual([
			{ title: 'Quick Start', blurb: 'A first setup.', href: '/quick-start' },
			{ title: 'Database Browser', blurb: 'Every entity.', href: '/pcd/dictionarry' }
		]);
	});

	it('throws on a link that leaves the site', () => {
		const broken = {
			title: 'FAQ',
			slug: 'faq',
			next: [{ title: 'GitHub', href: 'https://github.com' }]
		};
		expect(() => docNext(broken, [...docs, broken])).toThrow(/"faq".*site-relative/);
	});

	it('throws on an unknown slug', () => {
		const broken = { title: 'FAQ', slug: 'faq', next: ['quikc-start'] };
		expect(() => docNext(broken, [...docs, broken])).toThrow(/"faq".*"quikc-start"/);
	});
});

describe('moreInfoLinks', () => {
	const docs = [
		{ title: 'Docker', slug: 'installation/docker', parent: 'installation' },
		{ title: 'Installation', slug: 'installation' }
	];

	it('resolves slugs to titled links, with anchors and labels', () => {
		expect(
			moreInfoLinks('installation/docker, installation#the-parser: The parser', docs)
		).toEqual([
			{ label: 'Docker', href: '/installation/docker' },
			{ label: 'The parser', href: '/installation#the-parser' }
		]);
	});

	it('throws on an unknown slug', () => {
		expect(() => moreInfoLinks('dokcer', docs)).toThrow('unknown docs page "dokcer"');
	});

	it('serializes the tag as a line of links', () => {
		expect(moreInfoToMarkdown('Step.\n\n<MoreInfo pages="installation" />', docs)).toBe(
			'Step.\n\nMore info: [Installation](/installation)'
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

describe('docTree', () => {
	it('nests child pages under their parent, both in reading order', () => {
		const tree = docTree([
			{ title: 'Docker', slug: 'installation/docker', parent: 'installation', order: 1 },
			{ title: 'Installation', slug: 'installation', order: 2 },
			{
				title: 'Reverse Proxy',
				slug: 'installation/reverse-proxy',
				parent: 'installation',
				order: 2
			},
			{ title: 'Introduction', slug: 'introduction', order: 1 }
		]);

		const slugs = tree.map((doc) => [doc.slug, doc.children.map((child) => child.slug)]);

		expect(slugs).toEqual([
			['introduction', []],
			['installation', ['installation/docker', 'installation/reverse-proxy']]
		]);
	});

	it('nests a child page under a child page', () => {
		const tree = docTree([
			{
				title: 'Traefik',
				slug: 'installation/reverse-proxy/traefik',
				parent: 'installation/reverse-proxy',
				order: 1
			},
			{ title: 'Installation', slug: 'installation', order: 1 },
			{
				title: 'Reverse Proxies',
				slug: 'installation/reverse-proxy',
				parent: 'installation',
				order: 1
			}
		]);

		expect(tree[0].children[0].slug).toBe('installation/reverse-proxy');
		expect(tree[0].children[0].children.map((child) => child.slug)).toEqual([
			'installation/reverse-proxy/traefik'
		]);
	});

	it('throws on a parent route without a page', () => {
		const build = () =>
			docTree([{ title: 'Docker', slug: 'instalation/docker', parent: 'instalation' }]);

		expect(build).toThrow('Docs page "instalation/docker" has unknown parent "instalation"');
	});
});

describe('docSlugFromPath, docPath, and docMarkdownPath', () => {
	it('give the root page, the home page, an empty slug and the / path', () => {
		expect(docSlugFromPath('/src/routes/+page.svx')).toBe('');
		expect(docSlugFromPath('/src/routes/data.ts')).toBe('');
		expect(docPath('')).toBe('/');
		expect(docMarkdownPath('')).toBe('/index.md');
	});

	it('use the route path under the (docs) group for other pages', () => {
		expect(docSlugFromPath('/src/routes/(docs)/faq/+page.svx')).toBe('faq');
		expect(docSlugFromPath('/src/routes/(docs)/installation/docker/+page.svx')).toBe(
			'installation/docker'
		);
		expect(docSlugFromPath('/src/routes/(docs)/installation/docker/data.ts')).toBe(
			'installation/docker'
		);
		expect(docPath('installation/docker')).toBe('/installation/docker');
		expect(docMarkdownPath('installation/docker')).toBe('/installation/docker.md');
	});
});

describe('docParentSlug and docIndexEntry', () => {
	it('take the parent from the route, one level up', () => {
		expect(docParentSlug('installation/reverse-proxy/traefik')).toBe(
			'installation/reverse-proxy'
		);
		expect(docParentSlug('installation/docker')).toBe('installation');
		expect(docParentSlug('installation')).toBeUndefined();
		expect(docParentSlug('')).toBeUndefined();
	});

	it('build an entry with the slug and parent from the source path', () => {
		expect(
			docIndexEntry('/src/routes/(docs)/test/custom-formats/+page.svx', {
				title: 'Custom Formats'
			})
		).toEqual({ title: 'Custom Formats', slug: 'test/custom-formats', parent: 'test' });
		expect(docIndexEntry('/src/routes/(docs)/faq/+page.svx', { title: 'FAQ' })).toEqual({
			title: 'FAQ',
			slug: 'faq'
		});
	});
});

describe('docGroupMarkdownPath', () => {
	it('puts .group before the extension of the mirror path', () => {
		expect(docGroupMarkdownPath('')).toBe('/index.group.md');
		expect(docGroupMarkdownPath('deploy/upgrades')).toBe('/deploy/upgrades.group.md');
	});
});

describe('docHasGroup, docGroup, and docGroupToMarkdown', () => {
	const docs: DocIndexEntry[] = [
		{ title: 'FAQ', slug: 'faq', order: 3 },
		{
			title: 'Filtering',
			slug: 'deploy/upgrades/filtering',
			parent: 'deploy/upgrades',
			order: 2
		},
		{
			title: 'Upgrades',
			slug: 'deploy/upgrades',
			parent: 'deploy',
			order: 2,
			groupDescription: 'Why upgrades exist, then each part in detail.'
		},
		{ title: 'Profilarr', slug: '', order: 1, groupDescription: 'Every page of the docs.' },
		{
			title: 'Quick Start',
			slug: 'deploy/upgrades/quick-start',
			parent: 'deploy/upgrades',
			order: 1
		},
		{ title: 'Deploy', slug: 'deploy', order: 2, groupDescription: '#todo' },
		{ title: 'Sync', slug: 'deploy/sync', parent: 'deploy', order: 1 }
	];
	const page = (doc: DocIndexEntry) => `# ${doc.title}\n\nBody.`;

	it('count a page with child pages, and the root page, as heading a group', () => {
		expect(docHasGroup('', docs)).toBe(true);
		expect(docHasGroup('deploy', docs)).toBe(true);
		expect(docHasGroup('deploy/upgrades', docs)).toBe(true);
		expect(docHasGroup('deploy/sync', docs)).toBe(false);
		expect(docHasGroup('faq', docs)).toBe(false);
		expect(docGroup('faq', docs)).toBeUndefined();
		expect(docGroup('missing', docs)).toBeUndefined();
	});

	it('open with the title, description, and contents, then the pages in reading order', () => {
		const group = docGroup('deploy/upgrades', docs)!;

		expect(docGroupToMarkdown(group, page)).toBe(
			[
				'# Upgrades',
				'> Why upgrades exist, then each part in detail.',
				'The Upgrades section of the Profilarr documentation, 3 pages in reading order. Web version: https://profilarr.com/deploy/upgrades',
				'- [Upgrades](/deploy/upgrades.md)\n' +
					'  - [Quick Start](/deploy/upgrades/quick-start.md)\n' +
					'  - [Filtering](/deploy/upgrades/filtering.md)',
				'---',
				'# Upgrades\n\nBody.',
				'---',
				'# Upgrades: Quick Start\n\nBody.',
				'---',
				'# Upgrades: Filtering\n\nBody.'
			].join('\n\n')
		);
	});

	it('put every other page under the root page, with top-level titles left plain', () => {
		const markdown = docGroupToMarkdown(docGroup('', docs)!, page);

		expect(markdown).toContain(
			'The Profilarr documentation, 7 pages in reading order. Web version: https://profilarr.com/\n'
		);
		expect(markdown.match(/^# .*$/gm)).toEqual([
			'# Profilarr',
			'# Profilarr',
			'# Deploy',
			'# Deploy: Sync',
			'# Deploy: Upgrades',
			'# Upgrades: Quick Start',
			'# Upgrades: Filtering',
			'# FAQ'
		]);
	});

	it('leave out a description that is still a placeholder', () => {
		const markdown = docGroupToMarkdown(docGroup('deploy', docs)!, page);

		expect(markdown.startsWith('# Deploy\n\nThe Deploy section')).toBe(true);
		expect(markdown).not.toContain('#todo');
	});
});

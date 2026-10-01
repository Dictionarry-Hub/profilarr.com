import type { CodeExample, MarkdownColumn } from '$lib/shared/utils/llm/components.js';

// Component data for the Test page. The page renders it and the Markdown
// mirror serializes it, so both show the same thing.

export const firstDay: CodeExample[] = [
	{
		title: 'DTS-HD.MA',
		language: 'text',
		code: `Movie.2019.2160p.UHD.BluRay.[DTS-HD.MA].5.1-GROUP      lossless
Movie.2019.1080p.BluRay.DTS-HD.HRA.5.1-GROUP         lossy
Movie.2019.1080p.BluRay.DTS.5.1-GROUP                lossy`
	}
];

export const weeksLater: CodeExample[] = [
	{
		title: 'DTS-HD',
		language: 'text',
		code: `Movie.2019.1080p.BluRay.[DTS-HD].5.1-GROUP             lossless`
	}
];

export const regression: CodeExample[] = [
	{
		title: 'DTS-HD',
		language: 'text',
		code: `Movie.2019.1080p.BluRay.[DTS-HD].HRA.5.1-GROUP         lossy, wrong`
	}
];

type EntityTest = {
	entity: string;
	href: string;
	test: string;
};

export const entityTests: EntityTest[] = [
	{
		entity: 'Regular expressions',
		href: '/test/regular-expressions',
		test: 'Unit tests on regex101.com, run against the .NET regex engine Radarr and Sonarr use.'
	},
	{
		entity: 'Custom formats',
		href: '/test/custom-formats',
		test: 'Release titles with whether each one should match, and a breakdown of which conditions passed.'
	},
	{
		entity: 'Quality profiles',
		href: '/test/quality-profiles',
		test: 'Releases imported from a Radarr or Sonarr interactive search, scored against a profile.'
	}
];

export const entityTestColumns: MarkdownColumn<EntityTest>[] = [
	{ key: 'entity', header: 'Entity', markdown: (row) => `[${row.entity}](${row.href})` },
	{ key: 'test', header: 'Test' }
];

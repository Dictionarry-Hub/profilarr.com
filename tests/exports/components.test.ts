import { describe, expect, it } from 'vitest';
import {
	componentsToMarkdown,
	markdownCallout,
	markdownCode,
	markdownTable,
	markdownTree,
	mediaToMarkdown
} from '$lib/shared/utils/llm/components';

type Row = { name: string; note: string; flag?: boolean };

const rows: Row[] = [
	{ name: 'PUID', note: 'User ID | owner', flag: true },
	{ name: 'TZ', note: 'Timezone' }
];

const columns = [
	{
		key: 'name' as const,
		header: 'Name',
		markdown: (row: Row) => `\`${row.name}\`${row.flag ? ' (flagged)' : ''}`
	},
	{ key: 'note' as const, header: 'Note' }
];

describe('markdownTable', () => {
	it('uses column formatters and escapes pipes in cells', () => {
		expect(markdownTable(rows, columns)).toBe(
			'| Name | Note |\n| --- | --- |\n| `PUID` (flagged) | User ID \\| owner |\n| `TZ` | Timezone |'
		);
	});
});

describe('markdownCode', () => {
	it('fences each item under its title', () => {
		const markdown = markdownCode([{ title: 'compose.yml', language: 'yaml', code: 'a: 1\n' }]);

		expect(markdown).toBe('`compose.yml`\n\n```yaml\na: 1\n```');
	});

	it('explains the brackets of a marked block', () => {
		const markdown = markdownCode([{ title: 'DTS', language: 'text', code: 'x.[DTS].y' }], true);

		expect(markdown).toBe(
			'`DTS`\n\n```text\nx.[DTS].y\n```\n\nSquare brackets mark the text the expression matched. They are not part of the string.'
		);
	});
});

describe('markdownCallout', () => {
	it('quotes every line and labels the callout type', () => {
		expect(markdownCallout('warning', '\nFirst line.\n\n- Point\n')).toBe(
			'> **Warning:** First line.\n>\n> - Point'
		);
	});
});

describe('markdownTree', () => {
	it('draws folders, files, and notes like the tree command', () => {
		const markdown = markdownTree([
			{
				name: 'config',
				children: [
					{ name: 'data', note: 'Settings', children: [{ name: 'profilarr.db' }] },
					{ name: 'logs', children: [] }
				]
			}
		]);

		expect(markdown).toBe(
			'```text\nconfig/\n├── data/  # Settings\n│   └── profilarr.db\n└── logs/\n```'
		);
	});
});

describe('componentsToMarkdown', () => {
	const data = {
		rows,
		columns,
		example: [{ title: 'crontab', language: 'sh', code: 'echo hi' }],
		tree: [{ name: 'logs', children: [] }]
	};

	it('replaces a wrapped AdaptiveList, including its snippets and wrapper', () => {
		const body = [
			'Before.',
			'',
			'<div class="mb-5">',
			'<AdaptiveList',
			'\tdata={rows}',
			'\tcolumns={columns}',
			'\thref={(row) => row.href}>',
			'\t{#snippet card(row)}<div>{row.name}</div>{/snippet}',
			'</AdaptiveList>',
			'</div>',
			'',
			'After.'
		].join('\n');

		expect(componentsToMarkdown(body, data)).toBe(
			`Before.\n\n${markdownTable(rows, columns)}\n\nAfter.`
		);
	});

	it('replaces a CodeBlock tag that has other props', () => {
		const body = '<CodeBlock items={example} overflow="wrap" />';

		expect(componentsToMarkdown(body, data)).toBe('`crontab`\n\n```sh\necho hi\n```');
	});

	it('adds the brackets note for a marked CodeBlock', () => {
		const body = '<CodeBlock items={example} marks />';

		expect(componentsToMarkdown(body, data)).toBe(
			'`crontab`\n\n```sh\necho hi\n```\n\nSquare brackets mark the text the expression matched. They are not part of the string.'
		);
	});

	it('replaces CodeBlock and Callout tags', () => {
		const body = '<CodeBlock items={example} />\n\n<Callout type="info">\nNote.\n</Callout>';

		expect(componentsToMarkdown(body, data)).toBe(
			'`crontab`\n\n```sh\necho hi\n```\n\n> **Info:** Note.'
		);
	});

	it('replaces FileTree tags', () => {
		expect(componentsToMarkdown('<FileTree items={tree} />', data)).toBe('```text\nlogs/\n```');
	});

	it('leaves tags alone when the data module does not export their data', () => {
		const body = '<CodeBlock items={missing} />';

		expect(componentsToMarkdown(body, data)).toBe(body);
	});
});

describe('mediaToMarkdown', () => {
	it('turns images into linked alt text and videos into their text and a link', () => {
		const body = [
			'<ThemeImage',
			'\tdark="/images/a[style=dark].png"',
			'\tlight="/images/a[style=light].png"',
			'\talt="The scoring table" />',
			'',
			'<Video src="/video/clip.mp4" title="Molten" description="A cake is cut open." />'
		].join('\n');

		expect(mediaToMarkdown(body)).toBe(
			'![The scoring table](/images/a[style=light].png)\n\n' +
				'**Video: Molten.** A cake is cut open. [Watch the video](/video/clip.mp4)'
		);
	});
});

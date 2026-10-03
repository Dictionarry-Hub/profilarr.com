import type { Component } from 'svelte';
import { join } from './md.js';

// Markdown serializers for the Svelte components docs pages embed. A page
// keeps its component data in a data.ts next to +page.svx; the Markdown mirror
// imports the same module and swaps each component tag in the source for plain
// Markdown built from that data. See docs/backend/llm.md.

/** A column that AdaptiveList can render and the mirror can serialize.
    `markdown` formats a cell for the mirror; without it the raw value is used. */
export interface MarkdownColumn<T> {
	key: keyof T & string;
	header: string;
	markdown?: (row: T) => string;
}

/** One entry of a FileTree. Entries with `children` are folders, even when
    the array is empty. */
export interface TreeNode {
	name: string;
	note?: string;
	children?: TreeNode[];
}

/** One tab of a CodeBlock. */
export interface CodeExample {
	title: string;
	description?: string;
	language: string;
	code: string;
}

/** One tab of a Screenshots component. `light` and `dark` are the two
    versions of the image; until they exist the tab shows a placeholder. */
export interface Screenshot {
	label: string;
	/** Icon beside the tab label. */
	icon?: Component<{ class?: string }>;
	alt: string;
	caption?: string;
	light?: string;
	dark?: string;
	/** Outlines the image, for screenshots whose background matches the page. */
	border?: boolean;
}

function tableCell(value: string): string {
	return value.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');
}

export function markdownTable<T extends Record<string, unknown>>(
	rows: T[],
	columns: MarkdownColumn<T>[]
): string {
	const header = `| ${columns.map((column) => tableCell(column.header)).join(' | ')} |`;
	const divider = `| ${columns.map(() => '---').join(' | ')} |`;
	const body = rows.map((row) => {
		const cells = columns.map((column) =>
			tableCell(column.markdown ? column.markdown(row) : String(row[column.key] ?? ''))
		);
		return `| ${cells.join(' | ')} |`;
	});
	return [header, divider, ...body].join('\n');
}

function codeItem(item: CodeExample): string {
	const fence = '```';
	return join([
		`\`${item.title}\``,
		item.description ?? null,
		`${fence}${item.language}\n${item.code.trim()}\n${fence}`
	]);
}

const MARKS_NOTE =
	'Square brackets mark the text the expression matched. They are not part of the string.';

/** With `marks`, the note explains the `[text]` ranges a marked CodeBlock
    renders as highlights, since the mirror ships the brackets as written. */
export function markdownCode(items: CodeExample[], marks = false): string {
	const blocks = items.map(codeItem);
	if (marks) blocks.push(MARKS_NOTE);
	return join(blocks);
}

/** A plain-text tree like `tree` prints, in a fenced block. Folders end in a
    slash and notes follow as comments. */
export function markdownTree(items: TreeNode[]): string {
	const lines: string[] = [];
	const walk = (nodes: TreeNode[], prefix: string, root: boolean) => {
		nodes.forEach((node, index) => {
			const last = index === nodes.length - 1;
			const branch = root ? '' : last ? '└── ' : '├── ';
			const name = `${node.name}${node.children ? '/' : ''}`;
			lines.push(`${prefix}${branch}${name}${node.note ? `  # ${node.note}` : ''}`);
			if (node.children) {
				walk(node.children, root ? prefix : `${prefix}${last ? '    ' : '│   '}`, false);
			}
		});
	};
	walk(items, '', true);
	const fence = '```';
	return `${fence}text\n${lines.join('\n')}\n${fence}`;
}

// Callout types whose label in Callout.svelte isn't the capitalized type.
const CALLOUT_LABELS: Record<string, string> = { help: 'Help wanted' };

export function markdownCallout(type: string, body: string): string {
	const label = CALLOUT_LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
	const lines = `**${label}:** ${body.trim()}`.split('\n');
	return lines.map((line) => (line.trim() === '' ? '>' : `> ${line}`)).join('\n');
}

// Pages wrap each AdaptiveList in a spacing div; the wrapper goes with it.
const WRAPPED_LIST = /<div class="mb-5">\s*(<AdaptiveList\b[\s\S]*?<\/AdaptiveList>)\s*<\/div>/g;
const BARE_LIST = /<AdaptiveList\b[\s\S]*?<\/AdaptiveList>/g;

function attributes(tag: string): Record<string, string> {
	return Object.fromEntries([...tag.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
}

/** Replaces ThemeImage, Video, Dimensions, and InlineIcon tags with Markdown a
    model can read: an image becomes its alt text linked to the light version
    of the file, followed by its caption, a video becomes its title,
    description, and a link, an animation becomes its description, and an
    inline icon becomes its label. Used by every article mirror (docs, dev
    logs, wiki), since it needs no page data. */
export function mediaToMarkdown(body: string): string {
	return body
		.replace(/<ThemeImage\b[\s\S]*?\/>/g, (tag) => {
			const { alt = '', caption, light, dark } = attributes(tag);
			const src = light ?? dark;
			if (!src) return tag;
			const image = `![${alt}](${src})`;
			return caption ? `${image}\n\n${caption}` : image;
		})
		.replace(/<Video\b[\s\S]*?\/>/g, (tag) => {
			const { src, title, description } = attributes(tag);
			if (!src) return tag;
			const parts = [title ? `**Video: ${title}.**` : '**Video.**', description ?? ''];
			return `${parts.filter(Boolean).join(' ')} [Watch the video](${src})`;
		})
		.replace(/<Dimensions\b[\s\S]*?\/>/g, (tag) => {
			const { description } = attributes(tag);
			return description ? `**Animation.** ${description}` : tag;
		})
		.replace(/<InlineIcon\b[\s\S]*?\/>/g, (tag) => attributes(tag).label || tag);
}

/** Each screenshot as an image linked to its light version, with its caption.
    Placeholders without an image keep their label and caption. */
export function markdownScreenshots(items: Screenshot[]): string {
	return join(
		items.map((item) => {
			const src = item.light ?? item.dark;
			const image = src ? `![${item.alt}](${src})` : `**${item.label}.**`;
			return item.caption ? `${image}\n\n${item.caption}` : image;
		})
	);
}

function isRowList(value: unknown): value is Record<string, unknown>[] {
	return Array.isArray(value);
}

function isColumnList(value: unknown): value is MarkdownColumn<Record<string, unknown>>[] {
	return Array.isArray(value);
}

function isCodeList(value: unknown): value is CodeExample[] {
	return Array.isArray(value);
}

function isCodeExample(value: unknown): value is CodeExample {
	return (
		typeof value === 'object' && value !== null &&
		'title' in value && typeof value.title === 'string' &&
		'language' in value && typeof value.language === 'string' &&
		'code' in value && typeof value.code === 'string' &&
		(!('description' in value) || typeof value.description === 'string')
	);
}

function isTreeList(value: unknown): value is TreeNode[] {
	return Array.isArray(value);
}

function isScreenshotList(value: unknown): value is Screenshot[] {
	return Array.isArray(value);
}

/** Replaces AdaptiveList, PromptBuilder, CodeBlock, FileTree, Screenshots, and Callout tags with
    Markdown. `data` is the page's data.ts module; a tag that names data the
    module doesn't export is left as it is. */
export function componentsToMarkdown(body: string, data: Record<string, unknown>): string {
	const adaptiveList = (block: string): string => {
		const rows = data[block.match(/\bdata=\{(\w+)\}/)?.[1] ?? ''];
		if (/\bmarkdown="code"/.test(block)) {
			return isCodeList(rows) ? markdownCode(rows) : block;
		}
		const columns = data[block.match(/\bcolumns=\{(\w+)\}/)?.[1] ?? ''];
		return isRowList(rows) && isColumnList(columns) ? markdownTable(rows, columns) : block;
	};

	return body
		.replace(WRAPPED_LIST, (_, list: string) => adaptiveList(list))
		.replace(BARE_LIST, adaptiveList)
		.replace(/<PromptBuilder\b[\s\S]*?\/>/g, (tag) => {
			const prompt = data[tag.match(/\bprompt=\{(\w+)\}/)?.[1] ?? ''];
			return isCodeExample(prompt) ? codeItem(prompt) : tag;
		})
		.replace(/<CodeBlock\s+items=\{(\w+)\}([^>]*)\/>/g, (tag, name, rest: string) => {
			const items = data[name];
			return isCodeList(items) ? markdownCode(items, /\bmarks\b/.test(rest)) : tag;
		})
		.replace(/<FileTree\s+items=\{(\w+)\}\s*\/>/g, (tag, name) => {
			const items = data[name];
			return isTreeList(items) ? markdownTree(items) : tag;
		})
		.replace(/<Screenshots\s+items=\{(\w+)\}\s*\/>/g, (tag, name) => {
			const items = data[name];
			return isScreenshotList(items) ? markdownScreenshots(items) : tag;
		})
		.replace(/<Callout\s+type="(\w+)">([\s\S]*?)<\/Callout>/g, (_, type, inner) =>
			markdownCallout(type, inner)
		);
}

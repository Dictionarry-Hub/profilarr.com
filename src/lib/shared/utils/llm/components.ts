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
	language: string;
	code: string;
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
	return `\`${item.title}\`\n\n${fence}${item.language}\n${item.code.trim()}\n${fence}`;
}

export function markdownCode(items: CodeExample[]): string {
	return join(items.map(codeItem));
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

export function markdownCallout(type: string, body: string): string {
	const label = type.charAt(0).toUpperCase() + type.slice(1);
	const lines = `**${label}:** ${body.trim()}`.split('\n');
	return lines.map((line) => (line.trim() === '' ? '>' : `> ${line}`)).join('\n');
}

// Pages wrap each AdaptiveList in a spacing div; the wrapper goes with it.
const WRAPPED_LIST = /<div class="mb-5">\s*(<AdaptiveList\b[\s\S]*?<\/AdaptiveList>)\s*<\/div>/g;
const BARE_LIST = /<AdaptiveList\b[\s\S]*?<\/AdaptiveList>/g;

function attributes(tag: string): Record<string, string> {
	return Object.fromEntries([...tag.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
}

/** Replaces ThemeImage and Video tags with Markdown a model can read: an
    image becomes its alt text linked to the light version of the file, and a
    video becomes its title, description, and a link. Used by every article
    mirror (docs, dev logs, wiki), since it needs no page data. */
export function mediaToMarkdown(body: string): string {
	return body
		.replace(/<ThemeImage\b[\s\S]*?\/>/g, (tag) => {
			const { alt = '', light, dark } = attributes(tag);
			const src = light ?? dark;
			return src ? `![${alt}](${src})` : tag;
		})
		.replace(/<Video\b[\s\S]*?\/>/g, (tag) => {
			const { src, title, description } = attributes(tag);
			if (!src) return tag;
			const parts = [title ? `**Video: ${title}.**` : '**Video.**', description ?? ''];
			return `${parts.filter(Boolean).join(' ')} [Watch the video](${src})`;
		});
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

function isTreeList(value: unknown): value is TreeNode[] {
	return Array.isArray(value);
}

/** Replaces AdaptiveList, CodeBlock, FileTree, and Callout tags in an mdsvex body with
    Markdown. `data` is the page's data.ts module; a tag that names data the
    module doesn't export is left as it is. */
export function componentsToMarkdown(body: string, data: Record<string, unknown>): string {
	const adaptiveList = (block: string): string => {
		const rows = data[block.match(/\bdata=\{(\w+)\}/)?.[1] ?? ''];
		const columns = data[block.match(/\bcolumns=\{(\w+)\}/)?.[1] ?? ''];
		return isRowList(rows) && isColumnList(columns) ? markdownTable(rows, columns) : block;
	};

	return body
		.replace(WRAPPED_LIST, (_, list: string) => adaptiveList(list))
		.replace(BARE_LIST, adaptiveList)
		.replace(/<CodeBlock\s+items=\{(\w+)\}\s*\/>/g, (tag, name) => {
			const items = data[name];
			return isCodeList(items) ? markdownCode(items) : tag;
		})
		.replace(/<FileTree\s+items=\{(\w+)\}\s*\/>/g, (tag, name) => {
			const items = data[name];
			return isTreeList(items) ? markdownTree(items) : tag;
		})
		.replace(/<Callout\s+type="(\w+)">([\s\S]*?)<\/Callout>/g, (_, type, inner) =>
			markdownCallout(type, inner)
		);
}

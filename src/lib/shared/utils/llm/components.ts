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

export function markdownCallout(type: string, body: string): string {
	const label = type.charAt(0).toUpperCase() + type.slice(1);
	const lines = `**${label}:** ${body.trim()}`.split('\n');
	return lines.map((line) => (line.trim() === '' ? '>' : `> ${line}`)).join('\n');
}

// Pages wrap each AdaptiveList in a spacing div; the wrapper goes with it.
const WRAPPED_LIST = /<div class="mb-5">\s*(<AdaptiveList\b[\s\S]*?<\/AdaptiveList>)\s*<\/div>/g;
const BARE_LIST = /<AdaptiveList\b[\s\S]*?<\/AdaptiveList>/g;

function isRowList(value: unknown): value is Record<string, unknown>[] {
	return Array.isArray(value);
}

function isColumnList(value: unknown): value is MarkdownColumn<Record<string, unknown>>[] {
	return Array.isArray(value);
}

function isCodeList(value: unknown): value is CodeExample[] {
	return Array.isArray(value);
}

/** Replaces AdaptiveList, CodeBlock, and Callout tags in an mdsvex body with
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
		.replace(/<Callout\s+type="(\w+)">([\s\S]*?)<\/Callout>/g, (_, type, inner) =>
			markdownCallout(type, inner)
		);
}

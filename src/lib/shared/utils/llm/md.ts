/** Join markdown blocks with blank lines, dropping empty ones. */
export function join(blocks: (string | null)[]): string {
	return blocks
		.map((block) => block?.trim() ?? '')
		.filter((block) => block !== '')
		.join('\n\n');
}

/** Closing line of every Markdown artifact, so a reader of one page can find the rest. */
export function withIndexFooter(markdown: string, siteUrl: string): string {
	return `${markdown.trimEnd()}\n\n---\n\nIndex of this site's Markdown pages: ${siteUrl}/llms.txt\n`;
}

export function fence(language: string, code: string): string {
	return `\`\`\`${language}\n${code.trim()}\n\`\`\``;
}

/** YAML date parsing produces ISO timestamps; keep just the date part. */
export function isoDate(created: string): string {
	return String(created).slice(0, 10);
}

/** Strip frontmatter and script blocks from an mdsvex source, keeping the
    markdown body. Embedded components stay intact: they often carry real
    content in their props (e.g. CodeBlock code), and models read component
    tags fine. */
export function articleBody(source: string): string {
	return source
		.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
		.replace(/<script[\s\S]*?<\/script>\r?\n?/g, '')
		.trim();
}

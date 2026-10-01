/** Join markdown blocks with blank lines, dropping empty ones. */
export function join(blocks: (string | null)[]): string {
	return blocks
		.map((block) => block?.trim() ?? '')
		.filter((block) => block !== '')
		.join('\n\n');
}

/** Site-relative path of a page's Markdown version: the page path with `.md`
    appended, or `/index.md` for the home page. */
export function markdownPath(pathname: string): string {
	return pathname === '/' ? '/index.md' : `${pathname}.md`;
}

/** Closing line of every Markdown artifact, so a reader of one page can find the rest. */
export function withIndexFooter(markdown: string, siteUrl: string): string {
	return `${markdown.trimEnd()}\n\n---\n\nIndex of this site's Markdown pages: ${siteUrl}/llms.txt\n`;
}

/** Point site-relative Markdown links (`](/installation/docker)`) at the full site URL,
    so a page still resolves when it's read on its own, outside the site. Fenced
    code blocks are left as they are. */
export function absoluteLinks(markdown: string, siteUrl: string): string {
	let inFence = false;
	return markdown
		.split('\n')
		.map((line) => {
			if (line.trimStart().startsWith('```')) {
				inFence = !inFence;
				return line;
			}
			return inFence ? line : line.replace(/\]\(\/(?!\/)/g, `](${siteUrl}/`);
		})
		.join('\n');
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

// Where a wrapped code line continues, so CodeBlock's wrap mode can line the
// continuation up with the text above it instead of the left edge.

const hashComments = new Set([
	'yaml',
	'yml',
	'sh',
	'bash',
	'shell',
	'zsh',
	'shellscript',
	'python',
	'py'
]);
const slashComments = new Set([
	'javascript',
	'js',
	'typescript',
	'ts',
	'jsx',
	'tsx',
	'csharp',
	'cs',
	'c#'
]);

function commentMarker(language: string): string | null {
	const normalized = language.toLowerCase();
	if (hashComments.has(normalized)) return '#';
	if (slashComments.has(normalized)) return '//';
	return null;
}

// A marker only starts a comment at the start of the line or after
// whitespace, so `#` in a URL or `//` in `https://` doesn't count.
function commentStart(line: string, marker: string): number {
	let from = 0;
	for (;;) {
		const index = line.indexOf(marker, from);
		if (index === -1) return -1;
		if (index === 0 || /\s/.test(line[index - 1])) return index;
		from = index + 1;
	}
}

/** The column a wrapped line continues at: just after the comment marker and
    its space for a line with a comment, otherwise the line's own indentation. */
export function wrapIndent(line: string, language: string): number {
	const marker = commentMarker(language);
	const start = marker ? commentStart(line, marker) : -1;
	if (marker && start !== -1) {
		const text = start + marker.length;
		return line[text] === ' ' ? text + 1 : text;
	}
	return line.length - line.trimStart().length;
}

export function wrapIndents(code: string, language: string): number[] {
	return code.split('\n').map((line) => wrapIndent(line, language));
}

// Marked ranges in plain-text code, for CodeBlock's `marks` mode. A range is
// written as `[text]` in the source. The page renders it highlighted without
// the brackets; the Markdown mirror ships the brackets as they are.

export interface Segment {
	text: string;
	marked: boolean;
}

/** Splits a line into plain and marked segments. An unclosed `[` runs to the
    end of the line. Empty segments are dropped. */
export function markSegments(line: string): Segment[] {
	const segments: Segment[] = [];
	let marked = false;
	let start = 0;
	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (char !== (marked ? ']' : '[')) continue;
		if (i > start) segments.push({ text: line.slice(start, i), marked });
		marked = !marked;
		start = i + 1;
	}
	if (start < line.length) segments.push({ text: line.slice(start), marked });
	return segments;
}

/** The code with its markers removed, for copying and measuring. */
export function stripMarks(code: string): string {
	return code
		.split('\n')
		.map((line) =>
			markSegments(line)
				.map((segment) => segment.text)
				.join('')
		)
		.join('\n');
}

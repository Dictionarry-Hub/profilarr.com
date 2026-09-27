import { describe, expect, it } from 'vitest';
import {
	edgePath,
	mermaidBlock,
	parseMermaid,
	renderMermaid
} from '../../tooling/markdown/mermaid';

// These tests pin the fixes renderMermaid makes to beautiful-mermaid's output.
// If one fails after a beautiful-mermaid update, its output shape changed.

const DIAGRAM = [
	'flowchart LR',
	'  accTitle: Build and test',
	'  accDescr: A database feeds the build step, which feeds the test step.',
	'  D[Database] --> B[Build] --> T[Test]'
].join('\n');

describe('parseMermaid', () => {
	it('splits accTitle and accDescr out of the diagram', () => {
		const { diagram, title, description } = parseMermaid(DIAGRAM);

		expect(title).toBe('Build and test');
		expect(description).toBe('A database feeds the build step, which feeds the test step.');
		expect(diagram).not.toMatch(/acc(Title|Descr)/);
	});
});

describe('renderMermaid', () => {
	const svg = renderMermaid(DIAGRAM);
	const id = svg.match(/^<svg id="([^"]+)"/)?.[1];

	it('does not load external fonts', () => {
		expect(svg).not.toContain('@import');
		expect(svg).not.toContain('fonts.googleapis.com');
		expect(svg).not.toContain('font-family');
	});

	it('scopes every style rule to the diagram', () => {
		const css = svg.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
		const selectors = [...css.matchAll(/^\s*([^\s{}/][^{}\n]*?)\s*\{/gm)].map((m) => m[1]);

		expect(selectors.length).toBeGreaterThan(0);
		for (const selector of selectors) expect(selector.startsWith(`#${id}`)).toBe(true);
	});

	it('prefixes every id and reference with the diagram id', () => {
		const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
		const refs = [...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);

		expect(ids.length).toBeGreaterThan(1);
		for (const ref of [...ids, ...refs]) expect(ref.startsWith(id!)).toBe(true);
		for (const ref of refs) expect(ids).toContain(ref);
	});

	it('labels the svg with the title and description', () => {
		const open = `<svg id="${id}" role="img" aria-labelledby="${id}-title ${id}-desc"`;
		expect(svg.startsWith(open)).toBe(true);
		expect(svg).toContain(`<title id="${id}-title">Build and test</title>`);
		expect(svg).toContain(`<desc id="${id}-desc">`);
		expect(svg).not.toContain('data-id="accTitle"');
	});

	it('redraws edges as paths', () => {
		const branching = renderMermaid(
			'flowchart LR\n  accDescr: One node feeds two.\n  A --> B\n  A --> C'
		);

		expect(branching).not.toContain('<polyline class="edge"');
		expect(branching).toMatch(/<path class="edge"[^>]* d="M [^"]* Q [^"]*"[^>]*marker-end=/);
	});

	it('gives different diagrams different ids', () => {
		const other = renderMermaid(DIAGRAM.replace('Test', 'Deploy'));
		expect(other.match(/^<svg id="([^"]+)"/)?.[1]).not.toBe(id);
	});

	it('fails without a description', () => {
		expect(() => renderMermaid('flowchart LR\n  A --> B', 'page.svx')).toThrow(
			/page\.svx.*accDescr/
		);
	});
});

describe('mermaidBlock', () => {
	it('wraps the svg in a figure through {@html}', () => {
		const block = mermaidBlock(DIAGRAM);

		expect(block.startsWith('<figure class="mermaid-diagram">{@html "<svg')).toBe(true);
		expect(block.endsWith('"}</figure>')).toBe(true);
	});
});

describe('edgePath', () => {
	it('keeps straight edges straight', () => {
		expect(
			edgePath([
				{ x: 0, y: 0 },
				{ x: 50, y: 0 }
			])
		).toBe('M 0 0 L 50 0');
	});

	it('rounds each corner, shrinking the radius on short segments', () => {
		const d = edgePath([
			{ x: 0, y: 0 },
			{ x: 40, y: 0 },
			{ x: 40, y: 10 },
			{ x: 100, y: 10 }
		]);

		expect(d).toBe('M 0 0 L 35 0 Q 40 0, 40 5 L 40 5 Q 40 10, 45 10 L 100 10');
	});
});

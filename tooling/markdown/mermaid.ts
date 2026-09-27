import { createHash } from 'node:crypto';
import { renderMermaidSVG } from 'beautiful-mermaid';

// Renders ```mermaid fences in .svx files to inline SVG at build time. The
// Markdown mirrors ship the fence source verbatim, so models read the Mermaid
// and browsers get the SVG.
//
// beautiful-mermaid's output needs four changes before it can go on a page, all
// covered by tests/tooling/mermaid.test.ts. The package is pinned to an exact
// version because these fixes depend on its output shape.
//
// 1. Its <style> block imports the font from Google Fonts and uses bare `svg`
//    and `text` selectors that would style every SVG on the page. We drop the
//    imports and font rules (prose.css sets the fonts) and scope the rest to
//    the diagram.
// 2. Its marker ids are fixed, so two diagrams on one page would repeat them.
//    We prefix every id with a hash of the source.
// 3. It draws Mermaid's accTitle and accDescr lines as nodes. We read them
//    ourselves and turn them into the SVG's <title> and <desc>.
// 4. It draws flowchart edges as right-angled polylines. We redraw them as
//    curves to match the site's rounded style. Corner radii are set by
//    prose.css from the theme tokens, since they vary by theme.

const COLORS = {
	bg: 'var(--theme-bg)',
	fg: 'var(--theme-text)',
	muted: 'var(--theme-text-muted)',
	surface: 'var(--theme-surface)',
	border: 'var(--theme-border)',
	transparent: true
};

const ACCESSIBILITY_LINE = /^\s*(accTitle|accDescr)\s*:\s*(.*?)\s*$/;

export interface MermaidSource {
	diagram: string;
	title?: string;
	description?: string;
}

/** Splits accTitle and accDescr lines out of the diagram source. */
export function parseMermaid(code: string): MermaidSource {
	const source: MermaidSource = { diagram: '' };
	const lines: string[] = [];

	for (const line of code.split('\n')) {
		const match = line.match(ACCESSIBILITY_LINE);
		if (!match) lines.push(line);
		else if (match[1] === 'accTitle') source.title = match[2];
		else source.description = match[2];
	}

	source.diagram = lines.join('\n');
	return source;
}

function escapeXml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function scopeStyle(css: string, id: string): string {
	return css
		.split('\n')
		.filter((line) => !/^\s*@import\b/.test(line) && !/\{[^}]*font-family:[^}]*\}/.test(line))
		.join('\n')
		.replace(/^(\s*)([^\s{}@/][^{}\n]*?)\s*\{/gm, (_, indent: string, selector: string) =>
			selector === 'svg' ? `${indent}#${id} {` : `${indent}#${id} ${selector} {`
		);
}

interface Point {
	x: number;
	y: number;
}

const CORNER_RADIUS = 16;

function round(n: number): string {
	return String(Math.round(n * 100) / 100);
}

function at({ x, y }: Point): string {
	return `${round(x)} ${round(y)}`;
}

function toward(from: Point, to: Point, distance: number): Point {
	const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
	return {
		x: from.x + ((to.x - from.x) / length) * distance,
		y: from.y + ((to.y - from.y) / length) * distance
	};
}

/**
 * Turns an edge's right-angled route into a path with each corner replaced by
 * a quadratic curve. Short segments shrink the radius, so a small step between
 * two nodes becomes an S-curve. The route itself is unchanged, which keeps edge
 * labels on the line.
 */
export function edgePath(points: Point[]): string {
	let d = `M ${at(points[0])}`;
	for (let i = 1; i < points.length - 1; i++) {
		const [prev, corner, next] = [points[i - 1], points[i], points[i + 1]];
		const radius = Math.min(
			CORNER_RADIUS,
			Math.hypot(corner.x - prev.x, corner.y - prev.y) / 2,
			Math.hypot(next.x - corner.x, next.y - corner.y) / 2
		);
		d += ` L ${at(toward(corner, prev, radius))} Q ${at(corner)}, ${at(toward(corner, next, radius))}`;
	}
	return `${d} L ${at(points[points.length - 1])}`;
}

function curveEdges(svg: string): string {
	return svg.replace(
		/<polyline class="edge"([^>]*?) points="([^"]+)"([^>]*?)\/>/g,
		(_, before: string, points: string, after: string) => {
			const route = points
				.trim()
				.split(/\s+/)
				.map((pair) => {
					const [x, y] = pair.split(',').map(Number);
					return { x, y };
				});
			return `<path class="edge"${before} d="${edgePath(route)}"${after}/>`;
		}
	);
}

function prefixIds(svg: string, prefix: string): string {
	const ids = new Set([...svg.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
	return svg.replace(/(\sid="|url\(#|href="#)([^")]+)/g, (match, lead: string, name: string) =>
		ids.has(name) ? `${lead}${prefix}-${name}` : match
	);
}

/** Renders a Mermaid diagram to a self-contained, accessible SVG string. */
export function renderMermaid(code: string, file = 'unknown file'): string {
	const { diagram, title, description } = parseMermaid(code);

	if (!description) {
		throw new Error(`Mermaid diagram in ${file} needs an accDescr line for screen readers.`);
	}

	const id = `mermaid-${createHash('sha256').update(code).digest('hex').slice(0, 8)}`;
	let svg = curveEdges(prefixIds(renderMermaidSVG(diagram, COLORS), id));

	svg = svg.replace(
		/<style>([\s\S]*?)<\/style>/,
		(_, css: string) => `<style>${scopeStyle(css, id)}</style>`
	);

	const labels = [
		title && `<title id="${id}-title">${escapeXml(title)}</title>`,
		`<desc id="${id}-desc">${escapeXml(description)}</desc>`
	].filter(Boolean);
	const labelledBy = title ? `${id}-title ${id}-desc` : `${id}-desc`;

	svg = svg.replace(/^<svg\b/, `<svg id="${id}" role="img" aria-labelledby="${labelledBy}"`);
	svg = svg.replace(/^(<svg\b[^>]*>)/, `$1\n${labels.join('\n')}`);

	if (svg.includes('@import') || svg.includes('fonts.googleapis.com')) {
		throw new Error(`Mermaid diagram in ${file} still loads an external font after scoping.`);
	}

	return svg;
}

/**
 * mdsvex highlighter hook for ```mermaid fences. Returns Svelte markup; the SVG
 * goes through {@html} so Svelte does not parse the braces in its <style>.
 */
export function mermaidBlock(code: string, file?: string): string {
	const svg = JSON.stringify(renderMermaid(code, file));
	return `<figure class="mermaid-diagram">{@html ${svg}}</figure>`;
}

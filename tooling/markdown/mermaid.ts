import { createHash } from 'node:crypto';
import { renderMermaidSVG } from 'beautiful-mermaid';

// Renders ```mermaid fences in .svx files to inline SVG at build time. The
// Markdown mirrors ship the fence source verbatim, so models read the Mermaid
// and browsers get the SVG.
//
// beautiful-mermaid's output needs four fixes before it can go on a page, all
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
//    ourselves and turn them into accessible SVG descriptions.
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
const ROWS_LINE = /^\s*%%\s*rows\s*:\s*(.*?)\s*$/;

export interface MermaidSource {
	diagram: string;
	title?: string;
	description?: string;
	rows?: string[][];
}

/** Splits accessibility lines and row order comments out of the diagram source. */
export function parseMermaid(code: string): MermaidSource {
	const source: MermaidSource = { diagram: '' };
	const lines: string[] = [];

	for (const line of code.split('\n')) {
		const rows = line.match(ROWS_LINE);
		if (rows) {
			if (source.rows)
				throw new Error('Mermaid diagram must have only one rows declaration.');
			source.rows = rows[1].split('/').map((row) => row.trim().split(/\s+/));
			if (source.rows.some((row) => row.some((node) => !/^[A-Za-z_][\w-]*$/.test(node)))) {
				throw new Error(
					'Mermaid rows must list node IDs separated by spaces and rows by /.'
				);
			}
			continue;
		}
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

interface NodeBox {
	x: number;
	y: number;
	width: number;
	height: number;
	row: number;
}

/** Places rectangle nodes in explicit rows, alternating left-to-right and right-to-left. */
function layoutRows(svg: string, rows: string[][]): string {
	if (svg.includes('class="subgraph"') || svg.includes('class="edge-label"')) {
		throw new Error('Mermaid rows do not support subgraphs or edge labels.');
	}
	const nodes = new Map<string, NodeBox>();
	for (const match of svg.matchAll(/<g class="node"([^>]+)>([\s\S]*?)<\/g>/g)) {
		const node = match[1].match(/\bdata-id="([^"]+)"/)?.[1];
		const rectangle = match[2].match(/<rect\b([^>]+)>/);
		if (!node || !rectangle || !match[1].includes('data-shape="rectangle"')) {
			throw new Error('Mermaid rows support rectangle nodes only.');
		}
		const dimensions = Object.fromEntries(
			[...rectangle[1].matchAll(/\s(x|y|width|height)="([^"]+)"/g)].map((value) => [
				value[1],
				Number(value[2])
			])
		);
		nodes.set(node, {
			x: dimensions.x,
			y: dimensions.y,
			width: dimensions.width,
			height: dimensions.height,
			row: 0
		});
	}
	const ordered = rows.flat();
	if (
		ordered.length !== nodes.size ||
		new Set(ordered).size !== ordered.length ||
		ordered.some((node) => !nodes.has(node))
	) {
		throw new Error('Mermaid rows must include every node exactly once.');
	}
	const padding = 40;
	const gap = 64;
	const cellWidth = Math.max(...[...nodes.values()].map((node) => node.width));
	const cellHeight = Math.max(...[...nodes.values()].map((node) => node.height));
	const columns = Math.max(...rows.map((row) => row.length));
	const width = padding * 2 + columns * cellWidth + (columns - 1) * gap;
	const height = padding * 2 + rows.length * cellHeight + (rows.length - 1) * gap;
	const positioned = new Map<string, NodeBox>();
	rows.forEach((row, rowIndex) =>
		row.forEach((id, index) => {
			const node = nodes.get(id)!;
			const fraction = row.length === 1 ? 0.5 : index / (row.length - 1);
			const column = (rowIndex % 2 ? 1 - fraction : fraction) * (columns - 1);
			positioned.set(id, {
				...node,
				x: padding + column * (cellWidth + gap) + (cellWidth - node.width) / 2,
				y: padding + rowIndex * (cellHeight + gap) + (cellHeight - node.height) / 2,
				row: rowIndex
			});
		})
	);
	svg = svg.replace(/<g class="node"([^>]+)>/g, (_tag, attributes: string) => {
		const id = attributes.match(/\bdata-id="([^"]+)"/)![1];
		const before = nodes.get(id)!;
		const after = positioned.get(id)!;
		return `<g class="node"${attributes} transform="translate(${round(after.x - before.x)} ${round(after.y - before.y)})">`;
	});
	svg = svg.replace(/<path class="edge"([^>]+)\/>/g, (_tag, attributes: string) => {
		const from = positioned.get(attributes.match(/\bdata-from="([^"]+)"/)![1])!;
		const to = positioned.get(attributes.match(/\bdata-to="([^"]+)"/)![1])!;
		const right = from.row % 2 === 0;
		const start = { x: from.x + (right ? from.width : 0), y: from.y + from.height / 2 };
		const end = { x: to.x + (right ? 0 : to.width), y: to.y + to.height / 2 };
		let route = [start, end];
		if (from.row !== to.row) {
			end.x = to.x + (right ? to.width : 0);
			const outside = right ? width - padding / 2 : padding / 2;
			route = [start, { x: outside, y: start.y }, { x: outside, y: end.y }, end];
		}
		return `<path class="edge"${attributes.replace(/\bd="[^"]*"/, `d="${edgePath(route)}"`)}/>`;
	});
	return svg.replace(
		/viewBox="[^"]+" width="[^"]+" height="[^"]+"/,
		`viewBox="0 0 ${round(width)} ${round(height)}" width="${round(width)}" height="${round(height)}"`
	);
}

/** Renders a Mermaid diagram to a self-contained, accessible SVG string. */
export function renderMermaid(code: string, file = 'unknown file'): string {
	const { diagram, title, description, rows } = parseMermaid(code);

	if (!description) {
		throw new Error(`Mermaid diagram in ${file} needs an accDescr line for screen readers.`);
	}

	const id = `mermaid-${createHash('sha256').update(code).digest('hex').slice(0, 8)}`;
	let svg = curveEdges(prefixIds(renderMermaidSVG(diagram, COLORS), id));
	if (rows) svg = layoutRows(svg, rows);

	svg = svg.replace(
		/<style>([\s\S]*?)<\/style>/,
		(_, css: string) => `<style>${scopeStyle(css, id)}</style>`
	);

	// Descriptions provide an accessible name without a native browser tooltip.
	const labels = [
		title && `<desc id="${id}-title">${escapeXml(title)}</desc>`,
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

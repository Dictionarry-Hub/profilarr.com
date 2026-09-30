// Geometry for the Dimensions animation: a box whose width, height, and depth
// grow from zero, seen through a camera that can turn. Stage 1 draws a dot out
// into a line, stage 2 sweeps the line into a square, and stage 3 turns the
// camera and extrudes the square into a cube.

export type Stage = 1 | 2 | 3;

/** Edge length in viewBox units. */
export const SIZE = 60;
/** Dot radius in viewBox units. */
export const DOT = 3;
const PAD = DOT + 2;
const YAW = (-35 * Math.PI) / 180;
const PITCH = (25 * Math.PI) / 180;
/** Share of stage 3 spent turning the camera before the square extrudes. */
const TURN = 0.45;
const EPSILON = 1e-6;

type Vec = [number, number, number];

export interface Shape {
	/** Width, height, and depth. */
	dims: Vec;
	yaw: number;
	pitch: number;
}

export interface Geometry {
	faces: { points: string }[];
	edges: { x1: number; y1: number; x2: number; y2: number; hidden: boolean }[];
	dots: { x: number; y: number; hidden: boolean }[];
}

export function clamp(t: number): number {
	return Math.min(1, Math.max(0, t));
}

function ease(t: number): number {
	const c = clamp(t);
	return c < 0.5 ? 4 * c ** 3 : 1 - (-2 * c + 2) ** 3 / 2;
}

/** The shape `progress` (0 to 1) of the way through a stage. */
export function shapeAt(stage: Stage, progress: number): Shape {
	if (stage === 1) return { dims: [SIZE * ease(progress), 0, 0], yaw: 0, pitch: 0 };
	if (stage === 2) return { dims: [SIZE, SIZE * ease(progress), 0], yaw: 0, pitch: 0 };
	const turn = ease(progress / TURN);
	return {
		dims: [SIZE, SIZE, SIZE * ease((progress - TURN) / (1 - TURN))],
		yaw: YAW * turn,
		pitch: PITCH * turn
	};
}

/** How far the camera has turned toward its three-quarter view, from 0 to 1.
    The dots shade into spheres as it turns. */
export function roundness(shape: Shape): number {
	return clamp(shape.pitch / PITCH);
}

function rotate([x, y, z]: Vec, yaw: number, pitch: number): Vec {
	const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
	const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
	return [
		x1,
		y * Math.cos(pitch) - z1 * Math.sin(pitch),
		y * Math.sin(pitch) + z1 * Math.cos(pitch)
	];
}

// Vertex i sits on the positive side of axis a when bit a of i is set.
const VERTICES = Array.from({ length: 8 }, (_, i) =>
	[0, 1, 2].map((a) => ((i >> a) & 1 ? 1 : -1))
);
const OTHERS: [number, number][] = [
	[1, 2],
	[0, 2],
	[0, 1]
];
const CORNERS = [
	[-1, -1],
	[1, -1],
	[1, 1],
	[-1, 1]
];

export function geometry({ dims, yaw, pitch }: Shape): Geometry {
	const has = dims.map((d) => d > EPSILON);
	const solid = has.every(Boolean);
	// Screen coordinates flip y, since SVG's y axis points down.
	const points = VERTICES.map((signs) => {
		const [x, y] = rotate(signs.map((s, a) => (s * dims[a]) / 2) as Vec, yaw, pitch);
		return { x, y: -y };
	});

	// A face points at the camera when its turned normal does. Only a solid has
	// faces pointing away; a flat shape shows everything.
	const facing = (axis: number, sign: number) => {
		const normal: Vec = [0, 0, 0];
		normal[axis] = sign;
		return !solid || rotate(normal, yaw, pitch)[2] > 0;
	};

	const faces: Geometry['faces'] = [];
	for (let axis = 0; axis < 3; axis++) {
		const [b, c] = OTHERS[axis];
		if (!has[b] || !has[c]) continue;
		for (const sign of [1, -1]) {
			// With no depth along this axis, both faces sit in one place.
			if (!has[axis] && sign < 0) continue;
			if (!facing(axis, sign)) continue;
			const corners = CORNERS.map(([sb, sc]) => {
				const index = VERTICES.findIndex(
					(v) => v[axis] === sign && v[b] === sb && v[c] === sc
				);
				return `${points[index].x},${points[index].y}`;
			});
			faces.push({ points: corners.join(' ') });
		}
	}

	const edges: Geometry['edges'] = [];
	for (let i = 0; i < 8; i++) {
		for (let axis = 0; axis < 3; axis++) {
			const j = i | (1 << axis);
			if (j === i || !has[axis]) continue;
			const [b, c] = OTHERS[axis];
			edges.push({
				x1: points[i].x,
				y1: points[i].y,
				x2: points[j].x,
				y2: points[j].y,
				hidden: !facing(b, VERTICES[i][b]) && !facing(c, VERTICES[i][c])
			});
		}
	}

	// Vertices of a flat shape overlap in pairs, so keep one dot per position.
	const seen = new Set<string>();
	const dots: Geometry['dots'] = [];
	VERTICES.forEach((signs, i) => {
		const key = `${points[i].x.toFixed(3)},${points[i].y.toFixed(3)}`;
		if (seen.has(key)) return;
		seen.add(key);
		dots.push({ ...points[i], hidden: [0, 1, 2].every((a) => !facing(a, signs[a])) });
	});

	return { faces, edges, dots };
}

/** The viewBox that fits a stage's finished shape. */
export function bounds(stage: Stage): { x: number; y: number; width: number; height: number } {
	const { dots } = geometry(shapeAt(stage, 1));
	const xs = dots.map((d) => d.x);
	const ys = dots.map((d) => d.y);
	const x = Math.min(...xs) - PAD;
	const y = Math.min(...ys) - PAD;
	return { x, y, width: Math.max(...xs) + PAD - x, height: Math.max(...ys) + PAD - y };
}

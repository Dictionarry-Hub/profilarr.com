import { describe, expect, it } from 'vitest';
import { geometry, shapeAt } from '$lib/client/ui/markdown/dimensions/geometry';

describe('Dimensions geometry', () => {
	it('starts stage 1 as a single dot', () => {
		const { faces, edges, dots } = geometry(shapeAt(1, 0));

		expect(faces).toHaveLength(0);
		expect(edges).toHaveLength(0);
		expect(dots).toHaveLength(1);
	});

	it('ends stage 1 as a line and stage 2 as a square', () => {
		expect(geometry(shapeAt(1, 1)).dots).toHaveLength(2);

		const square = geometry(shapeAt(2, 1));
		expect(square.faces).toHaveLength(1);
		expect(square.dots).toHaveLength(4);
		expect(square.edges.every((edge) => !edge.hidden)).toBe(true);
	});

	it('ends stage 3 as a cube with three faces toward the camera', () => {
		const { faces, edges, dots } = geometry(shapeAt(3, 1));

		expect(faces).toHaveLength(3);
		expect(edges.filter((edge) => edge.hidden)).toHaveLength(3);
		expect(dots.filter((dot) => dot.hidden)).toHaveLength(1);
	});

	it('starts each stage where the one before it ends', () => {
		expect(shapeAt(2, 0).dims).toEqual(shapeAt(1, 1).dims);
		expect(shapeAt(3, 0).dims).toEqual(shapeAt(2, 1).dims);
		expect(Math.abs(shapeAt(3, 0).yaw)).toBe(0);
		expect(Math.abs(shapeAt(3, 0).pitch)).toBe(0);
	});
});

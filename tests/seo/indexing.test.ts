import { describe, expect, it } from 'vitest';
import { isIndexable } from '$lib/shared/utils/seo/indexing';

describe('isIndexable', () => {
	it('indexes pages outside the PCD browser', () => {
		expect(isIndexable('/')).toBe(true);
		expect(isIndexable('/installation/docker')).toBe(true);
		expect(isIndexable('/dev-logs/rebirth')).toBe(true);
		expect(isIndexable('/api/v1')).toBe(true);
	});

	it('indexes quality profile detail pages', () => {
		expect(isIndexable('/pcd/dictionarry/quality-profiles/1080p-balanced')).toBe(true);
	});

	it('leaves out every other PCD page', () => {
		expect(isIndexable('/pcd')).toBe(false);
		expect(isIndexable('/pcd/dictionarry')).toBe(false);
		expect(isIndexable('/pcd/dictionarry/quality-profiles')).toBe(false);
		expect(isIndexable('/pcd/dictionarry/custom-formats/1080p-balanced-tier-1')).toBe(false);
		expect(isIndexable('/pcd/dictionarry/regular-expressions/0bsidian')).toBe(false);
		expect(isIndexable('/pcd/dictionarry/naming/radarr/radarr')).toBe(false);
	});

	it('does not treat paths that only start with "pcd" as PCD pages', () => {
		expect(isIndexable('/pcdx')).toBe(true);
	});
});

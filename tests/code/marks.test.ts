import { describe, expect, it } from 'vitest';
import { markSegments, stripMarks } from '$lib/client/ui/markdown/code/marks';

describe('markSegments', () => {
	it('splits a line around a marked range', () => {
		expect(markSegments('Movie.2019.1080p.BluRay.[DTS].5.1-GROUP    lossy')).toEqual([
			{ text: 'Movie.2019.1080p.BluRay.', marked: false },
			{ text: 'DTS', marked: true },
			{ text: '.5.1-GROUP    lossy', marked: false }
		]);
	});

	it('leaves a line without markers as one plain segment', () => {
		expect(markSegments('Movie.2019.1080p.BluRay.DTS.5.1-GROUP')).toEqual([
			{ text: 'Movie.2019.1080p.BluRay.DTS.5.1-GROUP', marked: false }
		]);
	});

	it('handles several ranges and a range at either end', () => {
		expect(markSegments('[a]b[c]')).toEqual([
			{ text: 'a', marked: true },
			{ text: 'b', marked: false },
			{ text: 'c', marked: true }
		]);
	});

	it('runs an unclosed range to the end of the line', () => {
		expect(markSegments('a[bc')).toEqual([
			{ text: 'a', marked: false },
			{ text: 'bc', marked: true }
		]);
	});

	it('returns nothing for an empty line', () => {
		expect(markSegments('')).toEqual([]);
	});
});

describe('stripMarks', () => {
	it('removes the markers and keeps everything else', () => {
		expect(stripMarks('x.[DTS]-HD\ny.DTS\n')).toBe('x.DTS-HD\ny.DTS\n');
	});
});

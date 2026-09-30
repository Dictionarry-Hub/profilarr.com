import { describe, expect, it } from 'vitest';
import { captionParts } from '$lib/client/ui/markdown/image/caption';

describe('captionParts', () => {
	it('splits backtick spans out as code', () => {
		expect(captionParts('Linked to `LDsZXA/1`, with all four tests passing.')).toEqual([
			{ text: 'Linked to ', code: false },
			{ text: 'LDsZXA/1', code: true },
			{ text: ', with all four tests passing.', code: false }
		]);
	});

	it('keeps a caption without backticks as one plain part', () => {
		expect(captionParts('All four tests pass.')).toEqual([
			{ text: 'All four tests pass.', code: false }
		]);
	});
});

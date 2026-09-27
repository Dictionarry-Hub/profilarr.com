import { describe, expect, it } from 'vitest';
import { lastCommit } from '$lib/server/git';

describe('lastCommit', () => {
	it('has no commit for a file git has never seen', () => {
		expect(lastCommit('src/routes/docs/no-such-page/+page.svx')).toBeUndefined();
	});
});

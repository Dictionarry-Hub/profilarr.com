import { describe, expect, it } from 'vitest';
import rule from '../../tooling/lint/rules/require-media-alt';

function check(content: string) {
	return rule.check([{ path: 'page.svx', content }]);
}

describe('require-media-alt', () => {
	it('passes described images and videos', () => {
		const content = [
			'<ThemeImage dark="/a.png" light="/b.png" alt="The quality profile scoring table" />',
			'![The custom format testing tab](/images/test.png)',
			'<Video src="/v.mp4" description="A release is grabbed, then upgraded twice as better ones appear." />'
		].join('\n');

		expect(check(content)).toEqual([]);
	});

	it('flags missing and too-short text with the line it starts on', () => {
		const content = [
			'<ThemeImage dark="/a.png" light="/b.png" alt="cf" />',
			'![](/images/test.png)',
			'<Video',
			'\tsrc="/v.mp4" />'
		].join('\n');

		const violations = check(content);

		expect(violations.map((violation) => violation.line)).toEqual([1, 2, 3]);
		expect(violations[0].message).toContain('too short');
		expect(violations[1].message).toContain('missing');
		expect(violations[2].message).toContain('Video description is missing');
	});
});

import type { LintRule, Violation } from '../types.js';

// Images and videos in authored pages need text versions: screen readers read
// them, and the Markdown mirrors replace the media with them (see
// mediaToMarkdown in src/lib/shared/utils/llm/components.ts). The minimum
// lengths only catch placeholders; they can't judge a description.

export const MIN_ALT_LENGTH = 15;
export const MIN_VIDEO_DESCRIPTION_LENGTH = 50;

function attribute(tag: string, name: string): string | undefined {
	return tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}

function lineOf(content: string, index: number): number {
	return content.slice(0, index).split('\n').length;
}

const rule: LintRule = {
	name: 'require-media-alt',
	description: 'Images need alt text and videos need a description',
	category: 'media',
	severity: 'error',
	files: 'src/routes/**/*.svx',
	check(files) {
		const violations: Violation[] = [];
		const report = (file: string, content: string, index: number, message: string) =>
			violations.push({ rule: this.name, file, line: lineOf(content, index), message });

		for (const file of files) {
			const { path, content } = file;

			for (const match of content.matchAll(/<ThemeImage\b[\s\S]*?\/>/g)) {
				const alt = attribute(match[0], 'alt')?.trim() ?? '';
				if (alt.length < MIN_ALT_LENGTH) {
					report(
						path,
						content,
						match.index,
						`ThemeImage alt text is ${alt ? 'too short' : 'missing'}. Describe what the image shows in at least ${MIN_ALT_LENGTH} characters.`
					);
				}
			}

			for (const match of content.matchAll(/!\[([^\]]*)\]\(/g)) {
				const alt = match[1].trim();
				if (alt.length < MIN_ALT_LENGTH) {
					report(
						path,
						content,
						match.index,
						`Image alt text is ${alt ? 'too short' : 'missing'}. Describe what the image shows in at least ${MIN_ALT_LENGTH} characters.`
					);
				}
			}

			for (const match of content.matchAll(/<Video\b[\s\S]*?\/>/g)) {
				const description = attribute(match[0], 'description')?.trim() ?? '';
				if (description.length < MIN_VIDEO_DESCRIPTION_LENGTH) {
					report(
						path,
						content,
						match.index,
						`Video description is ${description ? 'too short' : 'missing'}. Describe what happens in the video as fully as you can, in at least ${MIN_VIDEO_DESCRIPTION_LENGTH} characters. Screen readers read it, and it replaces the video in the Markdown mirror.`
					);
				}
			}
		}

		return violations;
	}
};

export default rule;

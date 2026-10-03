import { parse } from 'yaml';
import type { LintRule, Violation } from '../types.js';

// A docs page with child pages heads a group, and its `groupDescription` opens
// the group's Markdown (see docGroupToMarkdown in
// src/lib/shared/utils/llm/docs.ts). A missing description fails. A short one
// only warns, so a group can ship with a placeholder like "#todo" before its
// description is written. The minimum can't judge whether a description is good.

export const MIN_GROUP_DESCRIPTION_LENGTH = 80;

const ROOT_PAGE = 'src/routes/+page.svx';
const DOCS_DIR = 'src/routes/(docs)/';
const PAGE_FILE = '+page.svx';

// The directory a docs page's child pages sit in, or undefined for a page
// outside the docs. The root page is the docs home page and heads every page
// in the (docs) route group.
function childDir(path: string): string | undefined {
	if (path === ROOT_PAGE) return DOCS_DIR;
	if (!path.startsWith(DOCS_DIR) || !path.endsWith(`/${PAGE_FILE}`)) return undefined;
	return path.slice(0, -PAGE_FILE.length);
}

function frontmatter(content: string): Record<string, unknown> {
	const block = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
	if (!block) return {};

	try {
		const parsed: unknown = parse(block);
		if (typeof parsed !== 'object' || parsed === null) return {};
		return parsed as Record<string, unknown>;
	} catch {
		return {};
	}
}

function lineOf(content: string, key: string): number {
	return content.split('\n').findIndex((line) => line.startsWith(`${key}:`)) + 1;
}

const rule: LintRule = {
	name: 'require-group-description',
	description: 'Docs pages with child pages need a groupDescription',
	category: 'llm',
	severity: 'error',
	files: 'src/routes/**/+page.svx',
	check(files) {
		const violations: Violation[] = [];
		const docs = files.flatMap((file) => {
			const dir = childDir(file.path);
			return dir === undefined ? [] : [{ ...file, dir }];
		});

		for (const { path, content, dir } of docs) {
			if (!docs.some((doc) => doc.path !== path && doc.path.startsWith(dir))) continue;

			const value = frontmatter(content).groupDescription;
			const description = typeof value === 'string' ? value.trim() : '';

			if (!description) {
				violations.push({
					rule: this.name,
					file: path,
					line: 1,
					message: `Page has child pages but no groupDescription. Add one to its frontmatter that says what the pages in the group cover, in at least ${MIN_GROUP_DESCRIPTION_LENGTH} characters. It opens the group's Markdown.`
				});
			} else if (description.length < MIN_GROUP_DESCRIPTION_LENGTH) {
				violations.push({
					rule: this.name,
					file: path,
					line: lineOf(content, 'groupDescription'),
					severity: 'warn',
					message: `groupDescription is ${description.length} characters. Say what the pages in the group cover in at least ${MIN_GROUP_DESCRIPTION_LENGTH}.`
				});
			}
		}

		return violations;
	}
};

export default rule;

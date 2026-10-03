import { describe, expect, it } from 'vitest';
import rule, {
	MIN_GROUP_DESCRIPTION_LENGTH
} from '../../tooling/lint/rules/require-group-description';

function page(path: string, frontmatter: string[] = []) {
	const content = ['---', 'layout: docs', 'title: Page', ...frontmatter, '---', '', 'Body.'];
	return { path, content: content.join('\n') };
}

const written = 'a'.repeat(MIN_GROUP_DESCRIPTION_LENGTH);
const child = page('src/routes/(docs)/deploy/sync/+page.svx');

describe('require-group-description', () => {
	it('fails a page with child pages and no description', () => {
		const violations = rule.check([page('src/routes/(docs)/deploy/+page.svx'), child]);

		expect(violations).toHaveLength(1);
		expect(violations[0].file).toBe('src/routes/(docs)/deploy/+page.svx');
		expect(violations[0].severity).toBeUndefined();
		expect(violations[0].message).toContain('no groupDescription');
	});

	it('warns on a short description, like a placeholder, with the line it is on', () => {
		const header = page('src/routes/(docs)/deploy/+page.svx', ['groupDescription: "#todo"']);
		const violations = rule.check([header, child]);

		expect(violations).toHaveLength(1);
		expect(violations[0].severity).toBe('warn');
		expect(violations[0].line).toBe(4);
		expect(violations[0].message).toContain('groupDescription is 5 characters');
	});

	it('passes a description of the minimum length', () => {
		const header = page('src/routes/(docs)/deploy/+page.svx', [`groupDescription: ${written}`]);

		expect(rule.check([header, child])).toEqual([]);
	});

	it('counts the root page as heading every docs page', () => {
		const violations = rule.check([page('src/routes/+page.svx'), child]);

		expect(violations.map((violation) => violation.file)).toEqual(['src/routes/+page.svx']);
	});

	it('ignores pages without child pages and pages outside the docs', () => {
		const files = [
			page('src/routes/+page.svx', [`groupDescription: ${written}`]),
			page('src/routes/(docs)/faq/+page.svx'),
			page('src/routes/(articles)/wiki/+page.svx'),
			page('src/routes/(articles)/wiki/eei/+page.svx')
		];

		expect(rule.check(files)).toEqual([]);
	});
});

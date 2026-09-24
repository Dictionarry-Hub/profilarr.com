import { describe, expect, it } from 'vitest';
import {
	commitInput,
	describeRule,
	matchesAll,
	parseToken,
	plainTextRules,
	replaceLastToken,
	suggest,
	tokenize,
	type FilterField,
	type FilterRule
} from '$lib/shared/utils/filter/rules';

interface Row {
	name: string;
	tags: string[];
	radarr: number | null;
}

const fields: FilterField<Row>[] = [
	{ key: 'name', label: 'Name', type: 'text', value: (row) => row.name },
	{
		key: 'tag',
		label: 'Tag',
		type: 'list',
		value: (row) => row.tags,
		suggestions: ['Audio', 'Release Group Tier', 'Streaming Service']
	},
	{ key: 'radarr', label: 'Radarr', type: 'number', value: (row) => row.radarr }
];

const rows: Row[] = [
	{ name: 'TrueHD Atmos', tags: ['Audio'], radarr: 5000 },
	{ name: 'DD+ 5.1', tags: ['Audio'], radarr: 1000 },
	{ name: 'BHDStudio', tags: ['Release Group Tier'], radarr: 20000 },
	{ name: '3D', tags: [], radarr: null }
];

function names(rules: FilterRule[]): string[] {
	return rows.filter((row) => matchesAll(row, rules, fields)).map((row) => row.name);
}

function rulesFor(input: string): FilterRule[] {
	return (tokenize(input) ?? []).map((token) => {
		const parsed = parseToken(token, fields);
		if (!parsed.ok) throw new Error(parsed.error);
		return parsed.rule;
	});
}

describe('tokenize', () => {
	it('splits on whitespace outside quotes', () => {
		expect(tokenize('radarr.gt.10 name.contains."DD+ 5.1" atmos')).toEqual([
			'radarr.gt.10',
			'name.contains."DD+ 5.1"',
			'atmos'
		]);
	});

	it('rejects an unclosed quote', () => {
		expect(tokenize('name.is."DD+')).toBeNull();
	});
});

describe('parseToken', () => {
	it('parses field rules case-insensitively', () => {
		expect(parseToken('Radarr.GT.1,000', fields)).toEqual({
			ok: true,
			rule: { kind: 'field', field: 'radarr', operator: 'gt', value: 1000, negate: false }
		});
	});

	it('keeps dots in unquoted values', () => {
		expect(parseToken('name.contains.5.1', fields)).toEqual({
			ok: true,
			rule: {
				kind: 'field',
				field: 'name',
				operator: 'contains',
				value: '5.1',
				negate: false
			}
		});
	});

	it('treats words without a known field as plain text', () => {
		expect(parseToken('5.1', fields)).toEqual({
			ok: true,
			rule: { kind: 'text', value: '5.1', negate: false }
		});
	});

	it('explains invalid rules', () => {
		expect(parseToken('radarr.gr.10', fields)).toEqual({
			ok: false,
			error: 'Unknown operator "gr" for radarr. Use gt, gte, lt, lte, or eq'
		});
		expect(parseToken('tag.', fields)).toEqual({
			ok: false,
			error: 'Add an operator after tag: is or contains'
		});
		expect(parseToken('radarr.gt.', fields)).toEqual({
			ok: false,
			error: 'Add a value after radarr.gt'
		});
		expect(parseToken('radarr.gt.lots', fields)).toEqual({
			ok: false,
			error: '"lots" is not a number'
		});
	});
});

describe('matching', () => {
	it('ANDs every rule', () => {
		expect(names(rulesFor('tag.is.audio radarr.gte.5000'))).toEqual(['TrueHD Atmos']);
	});

	it('matches plain text against text and list fields', () => {
		expect(names(rulesFor('tier'))).toEqual(['BHDStudio']);
		expect(names(rulesFor('"dd+ 5.1"'))).toEqual(['DD+ 5.1']);
	});

	it('inverts negated rules, including missing numbers', () => {
		const [rule] = rulesFor('radarr.gt.0');
		expect(names([{ ...rule, negate: true }])).toEqual(['3D']);
	});

	it('filters live with plain words only', () => {
		expect(names(plainTextRules('atmos radarr.gt.100000', fields))).toEqual(['TrueHD Atmos']);
		expect(plainTextRules('tag.is.audio radarr.gt.', fields)).toEqual([]);
	});
});

describe('commitInput', () => {
	it('commits field rules and leaves plain words as text', () => {
		const result = commitInput('atmos radarr.gt.10 "dd+ 5.1"', fields);
		expect(result).toEqual({
			ok: true,
			rules: [{ kind: 'field', field: 'radarr', operator: 'gt', value: 10, negate: false }],
			remaining: 'atmos "dd+ 5.1"'
		});
	});

	it('rejects plain words alone with a rule to use instead', () => {
		expect(commitInput('atmos', fields)).toEqual({
			ok: false,
			error: 'Plain words filter as you type. To keep one, use name.contains.atmos'
		});
	});

	it('rejects the whole input when any rule is invalid', () => {
		expect(commitInput('radarr.gt.10 radarr.gr.5', fields)).toEqual({
			ok: false,
			error: 'Unknown operator "gr" for radarr. Use gt, gte, lt, lte, or eq'
		});
	});
});

describe('describeRule', () => {
	it('labels rules for badges', () => {
		const [text, number, list] = rulesFor('atmos radarr.gte.1000 tag.is.Audio');
		expect(describeRule(text, fields)).toBe('Name or tag contains "atmos"');
		expect(describeRule(number, fields)).toBe('Radarr ≥ 1,000');
		expect(describeRule(list, fields)).toBe('Tag is "Audio"');
	});
});

describe('suggest', () => {
	it('walks from fields to operators to values', () => {
		expect(suggest('', fields).map((s) => s.insert)).toEqual(['name.', 'tag.', 'radarr.']);
		expect(suggest('ra', fields).map((s) => s.insert)).toEqual(['radarr.']);
		expect(suggest('ra', fields)[0]).toMatchObject({ label: 'Radarr', hint: 'Number' });
		expect(suggest('radarr.g', fields).map((s) => s.insert)).toEqual([
			'radarr.gt.',
			'radarr.gte.'
		]);
		expect(suggest('atmos tag.is.stream', fields)).toEqual([
			{
				label: 'Streaming Service',
				hint: 'Tag is',
				insert: 'tag.is."Streaming Service"',
				complete: true
			}
		]);
	});

	it('replaces only the token being typed', () => {
		expect(replaceLastToken('atmos ra', 'radarr.')).toBe('atmos radarr.');
		expect(replaceLastToken('atmos ', 'tag.')).toBe('atmos tag.');
	});
});

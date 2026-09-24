// Dot-syntax filter rules: `field.operator.value` (e.g. `radarr.gt.1000`,
// `tag.is."Audio"`). Words that do not start with a known field are plain
// text rules matched against every text and list field: they filter while
// typed and are never committed. All rules AND.

export type FilterFieldType = 'text' | 'list' | 'number';

export type FilterOperator = 'contains' | 'is' | 'gt' | 'gte' | 'lt' | 'lte' | 'eq';

export type FilterValue = string | string[] | number | null;

export interface FilterField<T> {
	/** Typed as the first segment of a rule, matched case-insensitively. */
	key: string;
	label: string;
	type: FilterFieldType;
	value: (row: T) => FilterValue;
	/** Known values offered as suggestions after the operator. */
	suggestions?: string[];
}

export type FilterRule =
	| { kind: 'text'; value: string; negate: boolean }
	| {
			kind: 'field';
			field: string;
			operator: FilterOperator;
			value: string | number;
			negate: boolean;
	  };

export type RuleParse = { ok: true; rule: FilterRule } | { ok: false; error: string };

export interface FilterSuggestion {
	label: string;
	hint: string;
	/** Replaces the token being typed. */
	insert: string;
	/** A complete rule: picking it commits instead of continuing to type. */
	complete: boolean;
}

export const OPERATORS: Record<FilterFieldType, FilterOperator[]> = {
	text: ['contains', 'is'],
	list: ['is', 'contains'],
	number: ['gt', 'gte', 'lt', 'lte', 'eq']
};

const TYPE_HINTS: Record<FilterFieldType, string> = {
	text: 'Text',
	list: 'List of values',
	number: 'Number'
};

const OPERATOR_HINTS: Record<FilterOperator, string> = {
	contains: 'contains text',
	is: 'matches exactly',
	gt: 'greater than',
	gte: 'at least',
	lt: 'less than',
	lte: 'at most',
	eq: 'equals'
};

const OPERATOR_SYMBOLS: Record<FilterOperator, string> = {
	contains: 'contains',
	is: 'is',
	gt: '>',
	gte: '≥',
	lt: '<',
	lte: '≤',
	eq: '='
};

const SUGGESTION_LIMIT = 8;

/** Splits on whitespace outside double quotes. Returns null on an unclosed quote. */
export function tokenize(input: string): string[] | null {
	const tokens: string[] = [];
	let current = '';
	let quoted = false;
	for (const char of input) {
		if (char === '"') quoted = !quoted;
		if (!quoted && /\s/.test(char)) {
			if (current) tokens.push(current);
			current = '';
		} else {
			current += char;
		}
	}
	if (quoted) return null;
	if (current) tokens.push(current);
	return tokens;
}

function unquote(value: string): string {
	return value.length >= 2 && value.startsWith('"') && value.endsWith('"')
		? value.slice(1, -1)
		: value;
}

function findField<T>(fields: FilterField<T>[], key: string): FilterField<T> | undefined {
	const lower = key.toLowerCase();
	return fields.find((field) => field.key.toLowerCase() === lower);
}

function listOf(items: string[]): string {
	if (items.length <= 2) return items.join(' or ');
	return `${items.slice(0, -1).join(', ')}, or ${items[items.length - 1]}`;
}

export function parseToken<T>(token: string, fields: FilterField<T>[]): RuleParse {
	const firstDot = token.indexOf('.');
	const field = firstDot > 0 ? findField(fields, token.slice(0, firstDot)) : undefined;
	if (!field) {
		const value = unquote(token);
		if (!value) return { ok: false, error: 'Empty search term' };
		return { ok: true, rule: { kind: 'text', value, negate: false } };
	}

	const operators = OPERATORS[field.type];
	const rest = token.slice(firstDot + 1);
	const secondDot = rest.indexOf('.');
	const operator = (secondDot === -1 ? rest : rest.slice(0, secondDot)).toLowerCase();
	if (!operator) {
		return { ok: false, error: `Add an operator after ${field.key}: ${listOf(operators)}` };
	}
	if (!operators.includes(operator as FilterOperator)) {
		return {
			ok: false,
			error: `Unknown operator "${operator}" for ${field.key}. Use ${listOf(operators)}`
		};
	}

	const raw = secondDot === -1 ? '' : unquote(rest.slice(secondDot + 1));
	if (!raw) return { ok: false, error: `Add a value after ${field.key}.${operator}` };

	if (field.type === 'number') {
		const number = Number(raw.replaceAll(',', ''));
		if (!/^-?\d[\d,]*(\.\d+)?$/.test(raw) || Number.isNaN(number)) {
			return { ok: false, error: `"${raw}" is not a number` };
		}
		return {
			ok: true,
			rule: {
				kind: 'field',
				field: field.key,
				operator: operator as FilterOperator,
				value: number,
				negate: false
			}
		};
	}

	return {
		ok: true,
		rule: {
			kind: 'field',
			field: field.key,
			operator: operator as FilterOperator,
			value: raw,
			negate: false
		}
	};
}

export type CommitResult =
	| { ok: true; rules: FilterRule[]; remaining: string }
	| { ok: false; error: string };

/**
 * Commits the field rules in the input and leaves plain words behind as text.
 * Any invalid rule fails the whole input, and so does input with no rules.
 */
export function commitInput<T>(input: string, fields: FilterField<T>[]): CommitResult {
	const tokens = tokenize(input);
	if (!tokens) return { ok: false, error: 'Missing a closing quote' };
	const rules: FilterRule[] = [];
	const words: string[] = [];
	for (const token of tokens) {
		const parsed = parseToken(token, fields);
		if (!parsed.ok) return parsed;
		if (parsed.rule.kind === 'field') rules.push(parsed.rule);
		else words.push(token);
	}
	if (rules.length === 0) {
		const field = textFields(fields)[0];
		if (!field) return { ok: false, error: 'Plain words filter as you type' };
		const example = `${field.key}.contains.${quoteValue(unquote(words[0] ?? ''))}`;
		return { ok: false, error: `Plain words filter as you type. To keep one, use ${example}` };
	}
	return { ok: true, rules, remaining: words.join(' ') };
}

/** Plain words in the input, as text rules for live filtering. */
export function plainTextRules<T>(input: string, fields: FilterField<T>[]): FilterRule[] {
	const tokens = tokenize(input) ?? tokenize(`${input}"`) ?? [];
	return tokens.flatMap((token) => {
		const parsed = parseToken(token, fields);
		return parsed.ok && parsed.rule.kind === 'text' ? [parsed.rule] : [];
	});
}

function textMatches(value: FilterValue, needle: string, exact: boolean): boolean {
	const target = needle.toLowerCase();
	const test = (item: string) =>
		exact ? item.toLowerCase() === target : item.toLowerCase().includes(target);
	if (typeof value === 'string') return test(value);
	if (Array.isArray(value)) return value.some(test);
	return false;
}

function fieldMatches(value: FilterValue, operator: FilterOperator, target: string | number) {
	if (typeof target === 'string') return textMatches(value, target, operator === 'is');
	if (typeof value !== 'number') return false;
	switch (operator) {
		case 'gt':
			return value > target;
		case 'gte':
			return value >= target;
		case 'lt':
			return value < target;
		case 'lte':
			return value <= target;
		default:
			return value === target;
	}
}

/** Plain text rules search every non-number field. */
function textFields<T>(fields: FilterField<T>[]): FilterField<T>[] {
	return fields.filter((field) => field.type !== 'number');
}

export function matchesRule<T>(row: T, rule: FilterRule, fields: FilterField<T>[]): boolean {
	let result: boolean;
	if (rule.kind === 'text') {
		const needle = rule.value;
		result = textFields(fields).some((field) => textMatches(field.value(row), needle, false));
	} else {
		const field = findField(fields, rule.field);
		result = field ? fieldMatches(field.value(row), rule.operator, rule.value) : false;
	}
	return rule.negate ? !result : result;
}

export function matchesAll<T>(row: T, rules: FilterRule[], fields: FilterField<T>[]): boolean {
	return rules.every((rule) => matchesRule(row, rule, fields));
}

export function describeRule<T>(rule: FilterRule, fields: FilterField<T>[]): string {
	if (rule.kind === 'text') {
		const subject = textFields(fields)
			.map((field, i) => (i === 0 ? field.label : field.label.toLowerCase()))
			.join(' or ');
		return `${subject} contains "${rule.value}"`;
	}
	const label = findField(fields, rule.field)?.label ?? rule.field;
	const value =
		typeof rule.value === 'number' ? rule.value.toLocaleString('en-US') : `"${rule.value}"`;
	return `${label} ${OPERATOR_SYMBOLS[rule.operator]} ${value}`;
}

export function sameRule(a: FilterRule, b: FilterRule): boolean {
	const sameValue = a.value.toString().toLowerCase() === b.value.toString().toLowerCase();
	if (a.kind === 'text' || b.kind === 'text') {
		return a.kind === b.kind && sameValue && a.negate === b.negate;
	}
	return a.field === b.field && a.operator === b.operator && sameValue && a.negate === b.negate;
}

function quoteValue(value: string): string {
	return /[\s."]/.test(value) ? `"${value}"` : value;
}

/** Suggestions for the last token of the input: fields, then operators, then values. */
export function suggest<T>(input: string, fields: FilterField<T>[]): FilterSuggestion[] {
	if (/\s$/.test(input) && tokenize(input) !== null) return suggestFor('', fields);
	const tokens = tokenize(input) ?? tokenize(`${input}"`) ?? [];
	return suggestFor(tokens[tokens.length - 1] ?? '', fields);
}

function suggestFor<T>(token: string, fields: FilterField<T>[]): FilterSuggestion[] {
	const firstDot = token.indexOf('.');
	if (firstDot === -1) {
		const lower = token.toLowerCase();
		return fields
			.filter((field) => field.key.toLowerCase().startsWith(lower))
			.map((field) => ({
				label: field.label,
				hint: TYPE_HINTS[field.type],
				insert: `${field.key}.`,
				complete: false
			}));
	}

	const field = findField(fields, token.slice(0, firstDot));
	if (!field) return [];
	const rest = token.slice(firstDot + 1);
	const secondDot = rest.indexOf('.');

	if (secondDot === -1) {
		const lower = rest.toLowerCase();
		return OPERATORS[field.type]
			.filter((operator) => operator.startsWith(lower))
			.map((operator) => ({
				label: `${field.key}.${operator}.`,
				hint: OPERATOR_HINTS[operator],
				insert: `${field.key}.${operator}.`,
				complete: false
			}));
	}

	const operator = rest.slice(0, secondDot).toLowerCase() as FilterOperator;
	if (!OPERATORS[field.type].includes(operator) || !field.suggestions) return [];
	const typed = rest.slice(secondDot + 1);
	const partial = typed.replace(/^"|"$/g, '').toLowerCase();
	return field.suggestions
		.filter((value) => value.toLowerCase().includes(partial))
		.slice(0, SUGGESTION_LIMIT)
		.map((value) => ({
			label: value,
			hint: `${field.label} ${OPERATOR_SYMBOLS[operator]}`,
			insert: `${field.key}.${operator}.${quoteValue(value)}`,
			complete: true
		}));
}

/** Replaces the token being typed at the end of the input. */
export function replaceLastToken(input: string, insert: string): string {
	if (/\s$/.test(input) && tokenize(input) !== null) return `${input}${insert}`;
	let quoted = false;
	let start = 0;
	for (let i = 0; i < input.length; i++) {
		if (input[i] === '"') quoted = !quoted;
		if (!quoted && /\s/.test(input[i])) start = i + 1;
	}
	return `${input.slice(0, start)}${insert}`;
}

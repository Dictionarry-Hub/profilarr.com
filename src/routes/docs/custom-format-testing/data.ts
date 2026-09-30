import type { MarkdownColumn } from '$lib/shared/utils/llm/components.js';

// Component data for the Custom Format Testing page. The page renders it and
// the Markdown mirror serializes it, so both show the same thing.

type BreakdownColumn = {
	column: string;
	meaning: string;
};

export const breakdown: BreakdownColumn[] = [
	{
		column: 'Pass',
		meaning:
			'Checks each condition on its own, comparing the value it expects with the value the parser read from the title.'
	},
	{
		column: 'Type Pass',
		meaning: 'Applies the rule to each type, combining the results of its conditions.'
	},
	{
		column: 'Expected',
		meaning: 'What you chose when you wrote the test.'
	},
	{
		column: 'Actual',
		meaning: 'Whether the custom format matched, which only happens when every type passed.'
	},
	{
		column: 'Result',
		meaning:
			"Compares Expected with Actual. The test passes when they agree, which is why the three releases that shouldn't match pass too."
	}
];

export const breakdownColumns: MarkdownColumn<BreakdownColumn>[] = [
	{ key: 'column', header: 'Column' },
	{ key: 'meaning', header: 'What it shows' }
];

import { describe, expect, it } from 'vitest';
import { DESCRIPTION_PLACEHOLDER, populatePrompt } from '$lib/shared/utils/llm/prompt';
import { upgradePrompt, upgradeFieldCatalog } from '../../src/routes/(docs)/deploy/upgrades/quick-start/ai';

describe('populatePrompt', () => {
	it('inserts a multiline description literally without interpreting replacement patterns', () => {
		const template = `Goal:\n${DESCRIPTION_PLACEHOLDER}\n\nSchema: {"type":"object"}`;
		const description = "  Movies tagged $& or $'.\nLeave $` and $$ unchanged.  ";

		expect(populatePrompt(template, description)).toBe(
			"Goal:\nMovies tagged $& or $'.\nLeave $` and $$ unchanged.\n\nSchema: {\"type\":\"object\"}"
		);
	});

	it('fills the upgrade goal without dropping the schema or follow-up instructions', () => {
		const result = populatePrompt(upgradePrompt.code, 'Replace banned release groups.');

		expect(result).toContain('for this goal:\n\nReplace banned release groups.');
		expect(result).not.toContain(DESCRIPTION_PLACEHOLDER);
		expect(result).toContain('How many items to search per run and how often to run upgrades.');
		expect(result).toContain('"additionalProperties": false');
		expect(result).toContain('https://profilarr.com/deploy/upgrades/fields.md');
	});
});

describe('upgrade prompt field contract', () => {
	it('keeps app-specific fields and value types distinct', () => {
		expect(upgradeFieldCatalog.radarr.find((field) => field.id === 'custom_format')).toMatchObject({
			operators: ['includes', 'does_not_include', 'is_only', 'has_any', 'has_none']
		});
		expect(upgradeFieldCatalog.sonarr.some((field) => field.id === 'custom_format')).toBe(false);
		expect(upgradeFieldCatalog.sonarr.find((field) => field.id === 'status')?.values).toEqual([
			'upcoming', 'continuing', 'ended', 'deleted'
		]);
		expect(upgradeFieldCatalog.shared.find((field) => field.id === 'quality_profile')?.operators)
			.toEqual(['eq', 'neq']);
		expect(upgradeFieldCatalog.shared.find((field) => field.id === 'date_added')?.value)
			.toContain('number of days');
	});
});

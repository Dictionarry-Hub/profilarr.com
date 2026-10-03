export const DESCRIPTION_PLACEHOLDER = '[User’s description]';

/** Inserts the user's description as literal text, including any replacement-pattern characters. */
export function populatePrompt(template: string, description: string): string {
	return template.replace(DESCRIPTION_PLACEHOLDER, () => description.trim());
}

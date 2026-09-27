import type { CodeExample } from '$lib/shared/utils/llm/components.js';

// Component data for the Contributing page. The page renders it and the
// Markdown mirror serializes it, so both show the same thing.

export const devSetup: CodeExample[] = [
	{
		title: 'Terminal',
		language: 'sh',
		code: `git clone https://github.com/Dictionarry-Hub/profilarr.git
cd profilarr
deno task dev`
	}
];

import { describe, expect, it } from 'vitest';
import { wrapIndent } from '$lib/client/ui/markdown/code/indent';

describe('wrapIndent', () => {
	it("uses a line's own indentation", () => {
		expect(wrapIndent('    image: ghcr.io/dictionarry-hub/profilarr:latest', 'yaml')).toBe(4);
	});

	it('continues a comment after its marker and space', () => {
		expect(wrapIndent('  # Not proxied: only Profilarr talks to the parser.', 'yaml')).toBe(4);
		expect(wrapIndent('      - traefik.enable=true # Opt in.', 'yaml')).toBe(30);
		expect(wrapIndent('\t// A comment.', 'ts')).toBe(4);
	});

	it('ignores markers inside a word', () => {
		expect(wrapIndent('  - ORIGIN=https://profilarr.example.com/#top', 'yaml')).toBe(2);
		expect(wrapIndent("  const url = 'https://profilarr.com';", 'ts')).toBe(2);
	});

	it('ignores comment markers in languages without them', () => {
		expect(wrapIndent('  # Heading', 'markdown')).toBe(2);
	});
});

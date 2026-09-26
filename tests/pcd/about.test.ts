import { describe, expect, it } from 'vitest';
import { renderAbout } from '$lib/shared/utils/pcd/about';

describe('renderAbout', () => {
	it('points relative links and images into the repo on GitHub', () => {
		const html = renderAbout(
			'[Profiles](docs/profiles.md) ![Logo](./assets/logo.png)',
			'Dictionarry-Hub/database',
			'v2'
		);

		expect(html).toContain(
			'href="https://github.com/Dictionarry-Hub/database/blob/v2/docs/profiles.md"'
		);
		expect(html).toContain(
			'src="https://raw.githubusercontent.com/Dictionarry-Hub/database/v2/assets/logo.png"'
		);
	});

	it('leaves absolute links and anchors alone', () => {
		const html = renderAbout(
			'[Site](https://profilarr.com) [Top](#top) [Mail](mailto:a@b.c)',
			'Dictionarry-Hub/database',
			'v2'
		);

		expect(html).toContain('href="https://profilarr.com"');
		expect(html).toContain('href="#top"');
		expect(html).toContain('href="mailto:a@b.c"');
	});
});

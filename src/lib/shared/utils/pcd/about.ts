import { Marked, type Token } from 'marked';

// Renders a database's ABOUT.md for its landing page. Relative links and
// images point into the repo on GitHub, the way GitHub resolves them in a
// README, since the file is read from a clone and not served by this site.

export function renderAbout(markdown: string, repo: string, branch: string): string {
	const renderer = new Marked({
		walkTokens(token: Token) {
			if (token.type !== 'link' && token.type !== 'image') return;
			if (isAbsolute(token.href)) return;

			const path = token.href.replace(/^\.?\//, '');
			if (token.type === 'image') {
				token.href = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;
			} else {
				token.href = `https://github.com/${repo}/blob/${branch}/${path}`;
			}
		}
	});

	return renderer.parse(markdown, { async: false }) as string;
}

function isAbsolute(href: string): boolean {
	return /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//') || href.startsWith('#');
}

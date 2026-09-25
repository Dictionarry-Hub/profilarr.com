import type { CompiledDatabase } from '$lib/types/pcd';
import { slugify } from '$lib/shared/utils/slug';
import type { DevLogIndexEntry } from './devlog.js';
import { join } from './md.js';
import { SITE_URL } from './site.js';
import type { WikiIndexEntry } from './wiki.js';

// /llms.txt, per the llms.txt convention (https://llmstxt.org/): an H1, a
// blockquote summary, then sections of links to the Markdown artifacts. See
// docs/backend/llm.md.

export interface LlmsInput {
	devLogs: DevLogIndexEntry[];
	wiki: WikiIndexEntry[];
	databases: CompiledDatabase[];
}

function link(title: string, url: string, note?: string): string {
	return `- [${title}](${url})${note ? `: ${note}` : ''}`;
}

function plural(count: number, one: string, many: string): string {
	return `${count} ${count === 1 ? one : many}`;
}

// The PCD list pages are not all built yet, so quality profiles are linked
// one by one and the other entity types are described by count and pattern.
function databaseSection(data: CompiledDatabase): string {
	const base = `${SITE_URL}/pcd/${data.id}`;
	const media = [data.media.radarr, data.media.sonarr];
	const counts = [
		plural(data.customFormats.length, 'custom format', 'custom formats'),
		plural(data.regularExpressions.length, 'regular expression', 'regular expressions'),
		plural(data.delayProfiles.length, 'delay profile', 'delay profiles'),
		plural(
			media.reduce((sum, arr) => sum + arr.naming.length, 0),
			'naming config',
			'naming configs'
		),
		plural(
			media.reduce((sum, arr) => sum + arr.settings.length, 0),
			'media settings config',
			'media settings configs'
		),
		plural(
			media.reduce((sum, arr) => sum + arr.qualityDefinitions.length, 0),
			'quality definitions config',
			'quality definitions configs'
		)
	];

	return join([
		`### ${data.name}`,
		data.qualityProfiles
			.map((profile) =>
				link(
					profile.name,
					`${base}/quality-profiles/${slugify(profile.name)}.md`,
					profile.tags.length > 0 ? profile.tags.join(', ') : undefined
				)
			)
			.join('\n'),
		`Also ${counts.join(', ')}.`
	]);
}

export function llmsTxt(input: LlmsInput): string {
	return join([
		'# Profilarr',
		'> Profilarr is a configuration management platform for Radarr and Sonarr: build, test, and' +
			' deploy configurations across your media stack. This site hosts its API reference, dev' +
			' logs, wiki, and a browser for Profilarr Compliant Databases (PCDs).',
		'Pages with a Markdown version serve it at the same URL with `.md` appended, and every' +
			' Markdown page links back to this index.',
		'## API Reference',
		link(
			'Profilarr API v1',
			`${SITE_URL}/api/v1.md`,
			'every endpoint with its parameters, request and response schemas, and a curl example'
		),
		'## Dev Logs',
		[
			link('All dev logs', `${SITE_URL}/dev-logs.md`),
			...input.devLogs.map((log) =>
				link(log.title, `${SITE_URL}/dev-logs/${log.slug}.md`, log.blurb)
			)
		].join('\n'),
		'## Wiki',
		[
			link('All wiki articles', `${SITE_URL}/wiki.md`),
			...input.wiki.map((article) =>
				link(article.title, `${SITE_URL}/wiki/${article.slug}.md`, article.blurb)
			)
		].join('\n'),
		'## PCD Browser',
		'Entities from each Profilarr Compliant Database, with every quality profile linked below.' +
			` \`${SITE_URL}/sitemap.xml\` lists every page, including each entity; an entity's` +
			' Markdown version is its page URL with `.md` appended.',
		...input.databases.map(databaseSection)
	]);
}

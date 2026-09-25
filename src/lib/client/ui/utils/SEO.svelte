<script lang="ts">
	import { page } from '$app/state';
	import { SITE_URL } from '$lib/shared/utils/llm/site.js';

	const SITE_NAME = 'Profilarr';
	const DEFAULT_DESCRIPTION = 'Configuration management platform for Radarr and Sonarr.';
	const DEFAULT_IMAGE =
		'https://raw.githubusercontent.com/Dictionarry-Hub/dictionarry.dev/develop/static/icon.png';
	const THEME_COLOR = '#597B91';

	interface Props {
		title: string;
		description?: string;
		image?: string;
		/** Site-relative path of the page's Markdown version, advertised as an alternate. */
		markdown?: string;
	}

	let {
		title,
		description = DEFAULT_DESCRIPTION,
		image = DEFAULT_IMAGE,
		markdown
	}: Props = $props();
	const canonicalUrl = $derived(`${SITE_URL}${page.url.pathname}`);
	// The site name closes every title so searches for "profilarr <topic>" match; the home page
	// passes the bare site name.
	const documentTitle = $derived(title === SITE_NAME ? title : `${title} - ${SITE_NAME}`);

	// Google reads the site name shown above results from WebSite structured data on the home
	// page. `<` is escaped so the JSON can never close its script tag.
	const websiteJsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		'name': SITE_NAME,
		'url': `${SITE_URL}/`
	}).replace(/</g, '\\u003c');
	// eslint-disable-next-line no-useless-escape -- a literal closing tag would end this script block
	const websiteJsonLdTag = `<script type="application/ld+json">${websiteJsonLd}<\/script>`;
</script>

<svelte:head>
	<title>{documentTitle}</title>
	<link
		rel="canonical"
		href={canonicalUrl} />
	{#if markdown}
		<link
			rel="alternate"
			type="text/markdown"
			href="{SITE_URL}{markdown}" />
	{/if}
	<meta
		name="description"
		content={description} />
	<meta
		name="theme-color"
		content={THEME_COLOR} />
	<meta
		property="og:type"
		content="website" />
	<meta
		property="og:site_name"
		content={SITE_NAME} />
	<meta
		property="og:title"
		content={title} />
	<meta
		property="og:description"
		content={description} />
	<meta
		property="og:image"
		content={image} />
	<meta
		name="twitter:card"
		content="summary" />
	<meta
		name="twitter:title"
		content={title} />
	<meta
		name="twitter:description"
		content={description} />
	<meta
		name="twitter:image"
		content={image} />
	{#if page.url.pathname === '/'}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON built above -->
		{@html websiteJsonLdTag}
	{/if}
</svelte:head>

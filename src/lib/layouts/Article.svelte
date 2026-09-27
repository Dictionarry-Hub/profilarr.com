<script lang="ts">
	import { page } from '$app/state';
	import SEO from '$lib/client/ui/utils/SEO.svelte';
	import PageActionsMenu from '$lib/client/ui/page-actions/PageActionsMenu.svelte';
	import PageHeader from '$lib/client/ui/header/PageHeader.svelte';
	import PageFooter from '$lib/client/ui/footer/PageFooter.svelte';
	import Author from '$lib/client/ui/author/Author.svelte';
	import DateTime from '$lib/client/ui/datetime/DateTime.svelte';
	import { docFullTitle, type DocLink } from '$lib/shared/utils/llm/docs.js';
	import { markdownPath } from '$lib/shared/utils/llm/md.js';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		blurb?: string;
		author?: string | string[];
		created?: string;
		tags?: string[];
		/** Docs only: slug of the page this one is listed under. */
		parent?: string;
		children: Snippet;
	}

	let { title, blurb, author, created, tags, parent, children }: Props = $props();

	// Docs child pages put their section in the document title, since titles
	// repeat across sections. The sidebar data holds the top-level page titles.
	const documentTitle = $derived.by(() => {
		if (!parent) return title;
		const docs = page.data.docs as { slug: string; title: string }[] | undefined;
		return docFullTitle(title, docs?.find((doc) => doc.slug === parent)?.title);
	});

	function parseAuthor(value: string) {
		try {
			const url = new URL(value);
			const name = url.pathname.split('/').filter(Boolean).pop() ?? value;
			const isGitHub = url.hostname === 'github.com';
			return { name, href: value, avatar: isGitHub ? `${value}.png` : undefined };
		} catch {
			return { name: value, href: undefined, avatar: undefined };
		}
	}

	// Docs only: the pages this one points readers at, resolved from its `next`
	// frontmatter by src/routes/+page.server.ts for the home page and
	// src/routes/docs/+layout.server.ts for the rest.
	const next = $derived((page.data.docNext as DocLink[] | undefined) ?? []);

	const authors = $derived.by(() => {
		if (!author) return [];
		const list = Array.isArray(author) ? author : [author];
		return list.map(parseAuthor);
	});
</script>

<SEO
	title={documentTitle}
	description={blurb}
	markdown={markdownPath(page.url.pathname)} />

<article>
	<PageHeader
		{title}
		{tags}>
		{#snippet actions()}
			<PageActionsMenu
				artifactPath={markdownPath(page.url.pathname)}
				pagePath={page.url.pathname} />
		{/snippet}
		{#snippet meta()}
			{#each authors as a (a.name)}
				<Author
					name={a.name}
					avatar={a.avatar}
					href={a.href} />
			{/each}
			{#if authors.length > 0 && created}
				<span class="text-text-muted">·</span>
			{/if}
			{#if created}
				<DateTime
					date={created}
					class="text-sm" />
			{/if}
		{/snippet}
	</PageHeader>

	<div class="prose">
		{@render children()}
	</div>

	<PageFooter links={next} />
</article>

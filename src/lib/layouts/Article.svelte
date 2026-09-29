<script lang="ts">
	import { page } from '$app/state';
	import SEO from '$lib/client/ui/utils/SEO.svelte';
	import PageActionsMenu from '$lib/client/ui/page-actions/PageActionsMenu.svelte';
	import PageHeader from '$lib/client/ui/header/PageHeader.svelte';
	import PageFooter from '$lib/client/ui/footer/PageFooter.svelte';
	import Author from '$lib/client/ui/author/Author.svelte';
	import DateTime from '$lib/client/ui/datetime/DateTime.svelte';
	import {
		docFullTitle,
		docNavEntries,
		type DocLink,
		type DocNavNode,
		type DocSource
	} from '$lib/shared/utils/llm/docs.js';
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
	// repeat across sections. The sidebar data holds every page's title.
	const documentTitle = $derived.by(() => {
		if (!parent) return title;
		const docs = docNavEntries((page.data.docs as DocNavNode[] | undefined) ?? []);
		return docFullTitle(title, docs.find((doc) => doc.slug === parent)?.title);
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

	// Docs only: the GitHub link to edit this page's source (in the Actions
	// menu), and when that source last changed with a link to that commit (in
	// the header). The date is missing in builds without git history.
	const source = $derived(page.data.docSource as DocSource | undefined);

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
				editUrl={source?.editUrl}
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
		{#snippet metaEnd()}
			{#if source?.updated}
				<span class="text-xs text-text-muted italic"
					>Last updated {#if source.commitUrl}<a
							href={source.commitUrl}
							target="_blank"
							rel="noopener noreferrer"
							title="View the last change to this page"
							class="transition-colors hover:text-link-text hover:underline"
							><DateTime date={source.updated} /></a
						>{:else}<DateTime date={source.updated} />{/if}</span>
			{/if}
		{/snippet}
	</PageHeader>

	<div class="prose">
		{@render children()}
	</div>

	<PageFooter links={next} />
</article>

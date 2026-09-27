<script lang="ts">
	import { page } from '$app/state';
	import { moreInfoLinks, type DocIndexEntry } from '$lib/shared/utils/llm/docs.js';

	interface Props {
		/** Comma-separated docs slugs, each with an optional `#anchor` and an
		    optional `: label`, as in `docker, installation#the-parser: The parser`. */
		pages: string;
	}

	let { pages }: Props = $props();

	interface NavDoc {
		title: string;
		slug: string;
		children: { title: string; slug: string }[];
	}

	// The sidebar data in the root layout has every docs page's title, so links
	// resolve without data of their own. An unknown slug throws while the page
	// prerenders, which fails the build.
	const docs = $derived.by((): DocIndexEntry[] =>
		((page.data.docs as NavDoc[] | undefined) ?? []).flatMap((doc) => [
			{ title: doc.title, slug: doc.slug },
			...doc.children.map((child) => ({ ...child, parent: doc.slug }))
		])
	);

	const links = $derived(moreInfoLinks(pages, docs));
</script>

<!-- A <span> styled as a flex row, so the markup stays valid whether or not
     Markdown wraps the tag in a paragraph. -->
<span class="more-info flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-muted">
	<span
		aria-hidden="true"
		class="-translate-y-px leading-none">📖</span>
	<span>More info:</span>
	{#each links as link, i (link.href)}
		<a href={link.href}>{link.label}</a>{#if i < links.length - 1}<span aria-hidden="true"
				>·</span
			>{/if}
	{/each}
</span>

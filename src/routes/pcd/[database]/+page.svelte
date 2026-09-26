<script lang="ts">
	import SEO from '$lib/client/ui/utils/SEO.svelte';
	import PageHeader from '$lib/client/ui/header/PageHeader.svelte';

	let { data } = $props();
</script>

<SEO
	title={data.name}
	description={data.description} />

<PageHeader
	title={data.name}
	tags={data.arrTypes}>
	{#snippet meta()}
		<span class="font-mono text-sm">v{data.version}</span>
		<span class="text-text-muted">·</span>
		<a
			href="https://github.com/{data.repo}"
			class="text-sm text-link-text hover:underline">{data.repo}</a>
	{/snippet}
</PageHeader>

<div class="prose">
	{#if data.aboutHtml}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- ABOUT.md parsed at build time -->
		{@html data.aboutHtml}
	{:else}
		<p>{data.description}</p>
	{/if}

	<h2>Browse</h2>
	<ul>
		{#each data.sections as section (section.segment)}
			<li>
				<a href="/pcd/{data.id}/{section.segment}">{section.label}</a> ({section.count})
			</li>
		{/each}
	</ul>
</div>

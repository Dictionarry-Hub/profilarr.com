<script lang="ts">
	import EntityHistory from '$lib/client/pcd/EntityHistory.svelte';
	import PageHeader from '$lib/client/ui/header/PageHeader.svelte';
	import SEO from '$lib/client/ui/utils/SEO.svelte';

	let { data } = $props();
	const profile = $derived(data.profile);
	const descriptionHtml = $derived(data.descriptionHtml);
</script>

<SEO
	title={profile.name}
	description={profile.description ?? undefined} />

<PageHeader
	title={profile.name}
	tags={profile.tags} />

<!-- The rest of the profile page is not built yet; Description and History ship first. -->
<section aria-labelledby="description">
	<h2
		id="description"
		class="mt-8 border-b border-border-muted pb-2 text-xl font-bold">
		Description
	</h2>
	{#if descriptionHtml}
		<div class="prose mt-2">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- markdown parsed at build time -->
			{@html descriptionHtml}
		</div>
	{:else}
		<p class="mt-2 text-sm text-text-muted italic">{profile.noDescriptionMessage}</p>
	{/if}
</section>

<h2
	id="history"
	class="mt-8 border-b border-border-muted pb-2 text-xl font-bold">
	History
</h2>
<EntityHistory history={data.history} />

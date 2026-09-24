<script lang="ts">
	import { CopyPlus, Earth, PanelBottomOpen, TrendingUp } from '@lucide/svelte';
	import EntityHistory from '$lib/client/pcd/EntityHistory.svelte';
	import Badge from '$lib/client/ui/badge/Badge.svelte';
	import PageHeader from '$lib/client/ui/header/PageHeader.svelte';
	import Tooltip from '$lib/client/ui/tooltip/Tooltip.svelte';
	import SEO from '$lib/client/ui/utils/SEO.svelte';

	let { data } = $props();
	const profile = $derived(data.profile);
	const descriptionHtml = $derived(data.descriptionHtml);

	const minScore = $derived(profile.minimumCustomFormatScore.toLocaleString('en-US'));
	const upgradeUntilScore = $derived(profile.upgradeUntilScore.toLocaleString('en-US'));
	const scoreIncrement = $derived(profile.upgradeScoreIncrement.toLocaleString('en-US'));
</script>

<SEO
	title={profile.name}
	description={profile.description ?? undefined} />

<PageHeader title={profile.name}>
	{#snippet actions()}
		<div class="flex flex-wrap justify-end gap-2">
			{#each profile.languages as language (language.name)}
				<Badge
					icon={Earth}
					iconColor="text-info-icon">{language.name}</Badge>
			{/each}
			{#each profile.tags as tag (tag)}
				<Badge>{tag}</Badge>
			{/each}
		</div>
	{/snippet}
</PageHeader>

<!-- The rest of the profile page is not built yet. -->
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

<section aria-labelledby="scoring">
	<div
		class="mt-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border-muted pb-2">
		<h2
			id="scoring"
			class="text-xl font-bold">
			Scoring
		</h2>
		<div class="flex flex-wrap gap-2">
			<Tooltip
				text="A release must have a custom format score of at least {minScore} to be downloaded.">
				<Badge
					icon={PanelBottomOpen}
					iconColor="text-info-icon">
					Min: {minScore}
				</Badge>
			</Tooltip>
			{#if profile.upgradesAllowed}
				<Tooltip
					text="Upgrades stop once the cutoff quality and a score of {upgradeUntilScore} are reached.">
					<Badge
						icon={TrendingUp}
						iconColor="text-success-icon">
						Until: {upgradeUntilScore}
					</Badge>
				</Tooltip>
				<Tooltip
					text="An upgrade must score at least {scoreIncrement} higher than the existing release.">
					<Badge
						icon={CopyPlus}
						iconColor="text-warning-icon">
						Increment: {scoreIncrement}
					</Badge>
				</Tooltip>
			{/if}
		</div>
	</div>
</section>

<h2
	id="history"
	class="mt-8 border-b border-border-muted pb-2 text-xl font-bold">
	History
</h2>
<EntityHistory history={data.history} />

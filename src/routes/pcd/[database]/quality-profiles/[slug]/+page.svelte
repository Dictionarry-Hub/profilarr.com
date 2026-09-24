<script lang="ts">
	import { page } from '$app/state';
	import { CopyPlus, Earth, PanelBottomOpen, Tags, TrendingUp } from '@lucide/svelte';
	import EntityHistory from '$lib/client/pcd/EntityHistory.svelte';
	import AdaptiveList from '$lib/client/ui/adaptive-list/AdaptiveList.svelte';
	import Badge from '$lib/client/ui/badge/Badge.svelte';
	import PageHeader from '$lib/client/ui/header/PageHeader.svelte';
	import SearchInput from '$lib/client/ui/input/SearchInput.svelte';
	import type { Column } from '$lib/client/ui/table/types';
	import Tooltip from '$lib/client/ui/tooltip/Tooltip.svelte';
	import SEO from '$lib/client/ui/utils/SEO.svelte';
	import {
		formatProfileScore,
		type ProfileCustomFormatScore
	} from '$lib/shared/utils/pcd/references';

	let { data } = $props();
	const profile = $derived(data.profile);
	const descriptionHtml = $derived(data.descriptionHtml);

	const minScore = $derived(profile.minimumCustomFormatScore.toLocaleString('en-US'));
	const upgradeUntilScore = $derived(profile.upgradeUntilScore.toLocaleString('en-US'));
	const scoreIncrement = $derived(profile.upgradeScoreIncrement.toLocaleString('en-US'));

	interface ScoreRow extends ProfileCustomFormatScore {
		radarrScore: number | null;
		sonarrScore: number | null;
	}

	const scoreRows = $derived.by((): ScoreRow[] =>
		data.scores.map((entry) => ({
			...entry,
			radarrScore: entry.scores.radarr,
			sonarrScore: entry.scores.sonarr
		}))
	);
	const scoreColumns: Column<ScoreRow>[] = [
		{ key: 'name', header: 'Custom Format', sortable: true },
		{ key: 'tags', header: 'Tags' },
		{
			key: 'radarrScore',
			header: 'Score',
			icon: { src: '/radarr.svg', alt: 'Radarr' },
			sortable: true
		},
		{
			key: 'sonarrScore',
			header: 'Score',
			icon: { src: '/sonarr.svg', alt: 'Sonarr' },
			sortable: true
		}
	];

	let query = $state('');

	// Every word has to match the name or a tag, so extra words narrow the list.
	const filteredRows = $derived.by((): ScoreRow[] => {
		const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
		if (terms.length === 0) return scoreRows;
		return scoreRows.filter((row) => {
			const text = [row.name, ...row.tags].join(' ').toLowerCase();
			return terms.every((term) => text.includes(term));
		});
	});

	function scoreHref(row: ScoreRow): string | undefined {
		return row.slug ? `/pcd/${page.params.database}/custom-formats/${row.slug}` : undefined;
	}

	function scoreClass(score: number): string {
		if (score > 0) return 'text-success-text';
		if (score < 0) return 'text-danger-text';
		return 'text-text-muted';
	}
</script>

{#snippet scoreValue(score: number)}
	<span class="text-sm font-medium tabular-nums {scoreClass(score)}">
		{formatProfileScore(score)}
	</span>
{/snippet}

{#snippet scoreCell(score: number | null)}
	{#if score === null}
		<span class="text-sm text-text-muted">-</span>
	{:else}
		{@render scoreValue(score)}
	{/if}
{/snippet}

{#snippet scoreList(row: ScoreRow)}
	<div class="flex flex-wrap items-center gap-3">
		{#if row.radarrScore !== null && row.radarrScore === row.sonarrScore}
			<span class="inline-flex items-center gap-1.5">
				<img
					src="/radarr.svg"
					alt="Radarr"
					class="size-5" />
				<img
					src="/sonarr.svg"
					alt="Sonarr"
					class="size-5" />
				{@render scoreValue(row.radarrScore)}
			</span>
		{:else}
			{#if row.radarrScore !== null}
				<span class="inline-flex items-center gap-1.5">
					<img
						src="/radarr.svg"
						alt="Radarr"
						class="size-5" />
					{@render scoreValue(row.radarrScore)}
				</span>
			{/if}
			{#if row.sonarrScore !== null}
				<span class="inline-flex items-center gap-1.5">
					<img
						src="/sonarr.svg"
						alt="Sonarr"
						class="size-5" />
					{@render scoreValue(row.sonarrScore)}
				</span>
			{/if}
		{/if}
	</div>
{/snippet}

{#snippet tagList(tags: string[])}
	<div class="flex flex-wrap gap-1">
		{#each tags as tag (tag)}
			<Badge
				size="sm"
				pill>{tag}</Badge>
		{/each}
	</div>
{/snippet}

{#snippet scoreResults()}
	{#if filteredRows.length > 0}
		<ul class="p-2">
			{#each filteredRows as row (row.name)}
				<li>
					<a
						href={scoreHref(row)}
						class="flex items-center justify-between gap-3 rounded-control px-3 py-2 transition-colors hover:bg-surface-hover">
						<span class="min-w-0">
							<span class="block truncate text-sm font-medium">{row.name}</span>
							{#if row.tags.length > 0}
								<span class="block truncate text-xs text-text-muted">
									{row.tags.join(', ')}
								</span>
							{/if}
						</span>
						<span class="shrink-0">{@render scoreList(row)}</span>
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="px-4 py-10 text-center text-sm text-text-muted">
			No custom formats match "{query.trim()}".
		</p>
	{/if}
{/snippet}

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

{#if descriptionHtml}
	<div class="prose *:last:mb-0">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- markdown parsed at build time -->
		{@html descriptionHtml}
	</div>
{/if}

<!-- The rest of the profile page is not built yet. -->
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
			{#if scoreRows.length > 0}
				<Badge
					icon={Tags}
					iconColor="text-accent-text">
					{#if filteredRows.length === scoreRows.length}
						{scoreRows.length} custom formats
					{:else}
						{filteredRows.length} of {scoreRows.length} custom formats
					{/if}
				</Badge>
			{/if}
		</div>
	</div>
	{#if scoreRows.length > 0}
		<SearchInput
			bind:value={query}
			placeholder="Filter by name or tag"
			mode="responsive"
			shortcut="/"
			results={scoreResults}
			class="mt-4 w-full" />
		{#if filteredRows.length > 0}
			<div class="mt-4">
				<AdaptiveList
					data={filteredRows}
					columns={scoreColumns}
					href={scoreHref}>
					{#snippet cell(row, column)}
						{#if column.key === 'name'}
							<span class="font-medium">{row.name}</span>
						{:else if column.key === 'tags'}
							{@render tagList(row.tags)}
						{:else if column.key === 'radarrScore'}
							{@render scoreCell(row.radarrScore)}
						{:else if column.key === 'sonarrScore'}
							{@render scoreCell(row.sonarrScore)}
						{/if}
					{/snippet}
					{#snippet card(row)}
						<p class="text-sm font-medium">{row.name}</p>
						{#if row.tags.length > 0}
							<div class="mt-2">{@render tagList(row.tags)}</div>
						{/if}
						<div class="mt-2">{@render scoreList(row)}</div>
					{/snippet}
				</AdaptiveList>
			</div>
		{:else}
			<p class="mt-4 text-sm text-text-muted italic">
				No custom formats match "{query.trim()}".
			</p>
		{/if}
	{:else}
		<p class="mt-4 text-sm text-text-muted italic">
			This profile does not score any custom formats.
		</p>
	{/if}
</section>

<h2
	id="history"
	class="mt-8 border-b border-border-muted pb-2 text-xl font-bold">
	History
</h2>
<EntityHistory history={data.history} />

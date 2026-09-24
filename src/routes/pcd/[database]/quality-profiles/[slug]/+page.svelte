<script lang="ts">
	import { page } from '$app/state';
	import {
		ArrowDown01,
		ArrowDown10,
		ArrowDownAZ,
		ArrowDownZA,
		CopyPlus,
		Earth,
		PanelBottomOpen,
		Tags,
		TrendingUp
	} from '@lucide/svelte';
	import type { Component } from 'svelte';
	import EntityHistory from '$lib/client/pcd/EntityHistory.svelte';
	import AdaptiveList from '$lib/client/ui/adaptive-list/AdaptiveList.svelte';
	import Badge from '$lib/client/ui/badge/Badge.svelte';
	import Button from '$lib/client/ui/button/Button.svelte';
	import Dropdown from '$lib/client/ui/dropdown/Dropdown.svelte';
	import DropdownHeader from '$lib/client/ui/dropdown/DropdownHeader.svelte';
	import PageHeader from '$lib/client/ui/header/PageHeader.svelte';
	import FilterInput from '$lib/client/ui/input/FilterInput.svelte';
	import type { Column } from '$lib/client/ui/table/types';
	import Tooltip from '$lib/client/ui/tooltip/Tooltip.svelte';
	import SEO from '$lib/client/ui/utils/SEO.svelte';
	import { clickOutside } from '$lib/client/utils/clickOutside';
	import { matchesAll, type FilterField, type FilterRule } from '$lib/shared/utils/filter/rules';
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
		{ key: 'name', header: 'Custom Format' },
		{ key: 'tags', header: 'Tags' },
		{
			key: 'radarrScore',
			header: 'Score',
			icon: { src: '/radarr.svg', alt: 'Radarr' }
		},
		{
			key: 'sonarrScore',
			header: 'Score',
			icon: { src: '/sonarr.svg', alt: 'Sonarr' }
		}
	];

	const scoreFields = $derived<FilterField<ScoreRow>[]>([
		{
			key: 'name',
			label: 'Name',
			type: 'text',
			value: (row) => row.name,
			suggestions: scoreRows.map((row) => row.name)
		},
		{
			key: 'tag',
			label: 'Tag',
			type: 'list',
			value: (row) => row.tags,
			suggestions: [...new Set(scoreRows.flatMap((row) => row.tags))].sort()
		},
		{ key: 'radarr', label: 'Radarr', type: 'number', value: (row) => row.radarrScore },
		{ key: 'sonarr', label: 'Sonarr', type: 'number', value: (row) => row.sonarrScore }
	]);

	let activeRules = $state<FilterRule[]>([]);
	const filteredRows = $derived(
		scoreRows.filter((row) => matchesAll(row, activeRules, scoreFields))
	);

	type SortKey = 'radarr' | 'sonarr' | 'name';
	type SortDirection = 'asc' | 'desc';

	interface SortOption {
		key: SortKey;
		label: string;
		directions: {
			direction: SortDirection;
			label: string;
			icon: Component<{ size?: number; class?: string }>;
		}[];
	}

	const scoreDirections: SortOption['directions'] = [
		{ direction: 'desc', label: 'Highest first', icon: ArrowDown10 },
		{ direction: 'asc', label: 'Lowest first', icon: ArrowDown01 }
	];

	const sortOptions: SortOption[] = [
		{ key: 'radarr', label: 'Radarr Score', directions: scoreDirections },
		{ key: 'sonarr', label: 'Sonarr Score', directions: scoreDirections },
		{
			key: 'name',
			label: 'Name',
			directions: [
				{ direction: 'asc', label: 'A to Z', icon: ArrowDownAZ },
				{ direction: 'desc', label: 'Z to A', icon: ArrowDownZA }
			]
		}
	];

	let sort = $state<{ key: SortKey; direction: SortDirection }>({
		key: 'radarr',
		direction: 'desc'
	});
	let sortOpen = $state(false);
	let sortEl: HTMLDivElement | undefined = $state();

	const sortOption = $derived(sortOptions.find((option) => option.key === sort.key)!);
	const sortDirection = $derived(
		sortOption.directions.find((entry) => entry.direction === sort.direction)!
	);

	const sortSummary = $derived(
		`Sorted by ${sortOption.label}, ${sortDirection.label.toLowerCase()}`
	);

	// Rows missing the sorted score go last in either direction; ties fall back to name.
	const sortedRows = $derived.by((): ScoreRow[] => {
		const { key, direction } = sort;
		const factor = direction === 'asc' ? 1 : -1;
		return [...filteredRows].sort((a, b) => {
			if (key === 'name') return a.name.localeCompare(b.name) * factor;
			const av = key === 'radarr' ? a.radarrScore : a.sonarrScore;
			const bv = key === 'radarr' ? b.radarrScore : b.sonarrScore;
			if (av === bv) return a.name.localeCompare(b.name);
			if (av === null) return 1;
			if (bv === null) return -1;
			return (av - bv) * factor;
		});
	});

	function isSorted(key: SortKey, direction: SortDirection): boolean {
		return sort.key === key && sort.direction === direction;
	}

	function selectSort(key: SortKey, direction: SortDirection) {
		sort = { key, direction };
		sortOpen = false;
	}

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
			{#each sortedRows as row (row.name)}
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
			No custom formats match these filters.
		</p>
	{/if}
{/snippet}

{#snippet sortMenu()}
	<div
		bind:this={sortEl}
		class="ml-2 flex"
		use:clickOutside={() => (sortOpen = false)}>
		<Button
			type="button"
			icon={sortDirection.icon}
			aria-label={sortSummary}
			aria-expanded={sortOpen}
			class="size-8.5 shrink-0"
			onclick={() => (sortOpen = !sortOpen)} />
		{#if sortOpen}
			<Dropdown
				triggerEl={sortEl}
				position="right"
				placement="bottom"
				ondismiss={() => (sortOpen = false)}>
				<DropdownHeader label={sortSummary} />
				{#each sortOptions as option (option.key)}
					<div
						class="flex items-center justify-between gap-4 border-b border-border-subtle px-3 py-1.5 text-sm last:border-b-0">
						<span>{option.label}</span>
						<div class="flex gap-1">
							{#each option.directions as entry (entry.direction)}
								<Tooltip text={entry.label}>
									<Button
										type="button"
										size="sm"
										icon={entry.icon}
										iconClass={isSorted(option.key, entry.direction)
											? 'text-accent-text'
											: 'text-text-muted'}
										aria-label="{option.label}, {entry.label.toLowerCase()}"
										aria-pressed={isSorted(option.key, entry.direction)}
										class="size-7"
										onclick={() => selectSort(option.key, entry.direction)} />
								</Tooltip>
							{/each}
						</div>
					</div>
				{/each}
			</Dropdown>
		{/if}
	</div>
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
		<FilterInput
			fields={scoreFields}
			bind:active={activeRules}
			placeholder="Filter by name or tag, or type a rule like radarr.gt.0"
			mode="responsive"
			shortcut="/"
			append={sortMenu}
			results={scoreResults}
			class="mt-4" />
		{#if filteredRows.length > 0}
			<div class="mt-4">
				<AdaptiveList
					data={sortedRows}
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
				No custom formats match these filters.
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

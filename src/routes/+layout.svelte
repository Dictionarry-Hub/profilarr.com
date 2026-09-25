<script lang="ts">
	import './layout.css';
	import { theme } from '$lib/client/ui/theme/theme.svelte';
	import { THEME_DEFINITIONS } from '$lib/client/ui/theme/themes';
	import { database, DATABASES } from '$lib/client/ui/database/database.svelte';
	import DropdownSelect from '$lib/client/ui/dropdown/DropdownSelect.svelte';
	import {
		NotebookPen,
		Library,
		Wrench,
		BookOpen,
		Trash2,
		Flame,
		SlidersHorizontal,
		Tags,
		Regex,
		Clock,
		FileText,
		Settings,
		Ruler,
		Code,
		TriangleAlert
	} from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import NavGroup from '$lib/client/ui/nav/NavGroup.svelte';
	import NavGroupLabel from '$lib/client/ui/nav/NavGroupLabel.svelte';
	import NavItem from '$lib/client/ui/nav/NavItem.svelte';
	import SearchPalette from '$lib/client/ui/search/SearchPalette.svelte';
	import TableOfContents from '$lib/client/ui/toc/TableOfContents.svelte';
	import { slugify } from '$lib/shared/utils/slug';
	import { loadPcdNav } from '$lib/client/pcd/nav';
	import type { PcdNavDatabase } from '$lib/types/pcd';

	const themeOptions = THEME_DEFINITIONS.map((d) => ({
		value: d.id,
		label: d.label,
		icon: d.icon
	}));

	const databaseIcons: Record<string, typeof BookOpen> = {
		'dictionarry': BookOpen,
		'trash': Trash2,
		'trash-french': Trash2,
		'trash-german': Trash2,
		'dumpstarr': Flame
	};

	let { children, data } = $props();

	// Build-time switch: set PUBLIC_WIP_BANNER=false to hide the banner.
	const showWipBanner = import.meta.env.PUBLIC_WIP_BANNER !== 'false';

	// Only databases this build compiled; production ships Dictionarry alone.
	const databaseOptions = $derived(
		DATABASES.filter((d) => data.pcdDatabases.includes(d.id)).map((d) => ({
			value: d.id,
			label: d.name,
			icon: databaseIcons[d.id]
		}))
	);

	let themeValue = $state(theme.current);
	let databaseValue = $state(database.current);
	let mounted = $state(false);

	const hasPcd = $derived(data.pcdDatabases.includes(databaseValue));
	const currentDatabase = $derived(databaseOptions.find((d) => d.value === databaseValue));

	// Sidebar entity names arrive after mount, one request per database. The
	// prerendered HTML has the seven group links but no entity names.
	let currentNav = $state<PcdNavDatabase | null>(null);
	$effect(() => {
		const id = databaseValue;
		if (!mounted || !data.pcdDatabases.includes(id)) {
			currentNav = null;
			return;
		}
		void loadPcdNav(id).then(
			(nav) => {
				if (databaseValue === id) currentNav = nav;
			},
			() => {
				if (databaseValue === id) currentNav = null;
			}
		);
	});
	const yamlView = $derived(mounted && page.url.searchParams.get('view') === 'yaml');
	// PCD pages are tables and diffs, not prose, so they get a wider column.
	const wideContent = $derived(database.isPcdRoute(page.url.pathname));

	// Sync database from URL when on PCD routes
	$effect(() => {
		const pathname = page.url.pathname;
		if (database.isPcdRoute(pathname)) {
			database.syncFromUrl(pathname);
			databaseValue = database.current;
		}
	});

	function onDatabaseChange(v: string) {
		const id = v as typeof database.current;
		database.set(id);

		// Navigate to the new database's equivalent page when on a PCD route
		const pathname = page.url.pathname;
		if (database.isPcdRoute(pathname)) {
			const newPath = pathname.replace(/^\/pcd\/[^/]+/, `/pcd/${id}`);
			goto(newPath);
		}
	}

	onMount(() => {
		mounted = true;
		theme.init();
		themeValue = theme.current;
		database.init(data.pcdDatabases);
		databaseValue = database.current;
	});
</script>

<!-- Work-in-progress notice while the v4 site is live at profilarr.com. Fixed to the top of
     the viewport above the sidebar and content, which both start below it. -->
{#if showWipBanner}
	<div
		role="note"
		class="wip-banner fixed inset-x-0 top-0 z-40 flex h-(--banner-height) items-center justify-center gap-2 border-b border-border bg-bg px-6 text-sm text-text-soft">
		<TriangleAlert
			size={16}
			class="shrink-0 text-warning-icon" />
		<span class="truncate">
			This site is still a work in progress. For the current docs, head to
			<a
				href="https://dictionarry.dev"
				class="text-link-text hover:underline">dictionarry.dev</a
			>.
		</span>
	</div>
{/if}

<div
	class="fixed top-(--banner-height) left-0 flex h-[calc(100vh-var(--banner-height))] w-80 flex-col bg-bg font-sans text-text">
	<!-- Navbar: logo, database switcher, and theme switcher. The database switcher only shows
	     when the build compiled more than one database; production ships Dictionarry alone. -->
	<div class="flex items-center justify-between border-r border-b border-border px-6 py-4">
		<div class="flex items-center gap-2">
			<img
				src="/icon.png"
				alt="profilarr"
				class="size-5" />
			<span class="flex items-baseline gap-1">
				<span class="font-accent text-lg font-semibold">profilarr</span>
				<span class="font-mono text-sm text-text-muted">/docs</span>
			</span>
		</div>
		<div class="flex items-center gap-2">
			{#if databaseOptions.length > 1}
				<DropdownSelect
					bind:value={databaseValue}
					options={databaseOptions}
					header="Database"
					position="middle"
					iconOnly
					variant="ghost"
					size="lg"
					onchange={onDatabaseChange} />
			{/if}
			<DropdownSelect
				bind:value={themeValue}
				options={themeOptions}
				header="Theme"
				position="middle"
				iconOnly
				variant="ghost"
				size="lg"
				onchange={(v) => theme.set(v as typeof theme.current)} />
		</div>
	</div>
	<!-- Page nav -->
	<div class="flex-1 overflow-y-auto border-r border-border px-4 py-4">
		<div class="mb-4">
			<SearchPalette database={databaseValue} />
		</div>

		<!-- PCD reference: the whole subtree is scoped to one database, so the
		     database name is its root. -->
		{#if hasPcd}
			<NavGroupLabel
				label={currentDatabase?.label ?? databaseValue}
				icon={currentDatabase?.icon}>
				<NavGroup
					label="Quality Profiles"
					href="/pcd/{databaseValue}/quality-profiles"
					icon={SlidersHorizontal}
					open={false}
					class="mb-1">
					{#each currentNav?.qualityProfiles ?? [] as name (name)}
						<NavItem
							label={name}
							href="/pcd/{databaseValue}/quality-profiles/{slugify(name)}" />
					{/each}
				</NavGroup>

				<NavGroup
					label="Custom Formats"
					href="/pcd/{databaseValue}/custom-formats"
					icon={Tags}
					open={false}
					class="mb-1">
					{#each currentNav?.customFormats ?? [] as name (name)}
						<NavItem
							label={name}
							href="/pcd/{databaseValue}/custom-formats/{slugify(name)}" />
					{/each}
				</NavGroup>

				<NavGroup
					label="Regular Expressions"
					href="/pcd/{databaseValue}/regular-expressions"
					icon={Regex}
					open={false}
					class="mb-1">
					{#each currentNav?.regularExpressions ?? [] as name (name)}
						<NavItem
							label={name}
							href="/pcd/{databaseValue}/regular-expressions/{slugify(name)}" />
					{/each}
				</NavGroup>

				<NavGroup
					label="Delay Profiles"
					href="/pcd/{databaseValue}/delay-profiles"
					icon={Clock}
					open={false}
					class="mb-1">
					{#each currentNav?.delayProfiles ?? [] as name (name)}
						<NavItem
							label={name}
							href="/pcd/{databaseValue}/delay-profiles/{slugify(name)}" />
					{/each}
				</NavGroup>

				<NavGroup
					label="Naming"
					href="/pcd/{databaseValue}/naming"
					icon={FileText}
					open={false}
					class="mb-1">
					{#each currentNav?.naming ?? [] as entry (`${entry.arrType}/${entry.name}`)}
						<NavItem
							label={entry.name}
							image="/{entry.arrType}.svg"
							href="/pcd/{databaseValue}/naming/{entry.arrType}/{slugify(
								entry.name
							)}" />
					{/each}
				</NavGroup>

				<NavGroup
					label="Media Settings"
					href="/pcd/{databaseValue}/media-settings"
					icon={Settings}
					open={false}
					class="mb-1">
					{#each currentNav?.mediaSettings ?? [] as entry (`${entry.arrType}/${entry.name}`)}
						<NavItem
							label={entry.name}
							image="/{entry.arrType}.svg"
							href="/pcd/{databaseValue}/media-settings/{entry.arrType}/{slugify(
								entry.name
							)}" />
					{/each}
				</NavGroup>

				<NavGroup
					label="Quality Definitions"
					href="/pcd/{databaseValue}/quality-definitions"
					icon={Ruler}
					open={false}
					class="mb-1">
					{#each currentNav?.qualityDefinitions ?? [] as entry (`${entry.arrType}/${entry.name}`)}
						<NavItem
							label={entry.name}
							image="/{entry.arrType}.svg"
							href="/pcd/{databaseValue}/quality-definitions/{entry.arrType}/{slugify(
								entry.name
							)}" />
					{/each}
				</NavGroup>
			</NavGroupLabel>
		{/if}

		{#if data.devLogs.length > 0}
			<NavGroup
				label="Dev Logs"
				href="/dev-logs"
				icon={NotebookPen}
				open={false}>
				{#each data.devLogs as log (log.href)}
					<NavItem
						label={log.title}
						href={log.href} />
				{/each}
			</NavGroup>
		{/if}

		{#if data.wiki.length > 0}
			<NavGroup
				label="Wiki"
				href="/wiki"
				icon={Library}
				open={false}>
				{#each data.wiki as article (article.href)}
					<NavItem
						label={article.title}
						href={article.href} />
				{/each}
			</NavGroup>
		{/if}

		<NavGroup
			label="API Reference"
			href="/api/v1"
			icon={Code} />

		{#if import.meta.env.DEV}
			<NavGroup
				label="Dev"
				href="/dev"
				icon={Wrench}>
				<NavItem
					label="UI Showcase"
					href="/dev/ui" />
				<NavItem
					label="Error 404"
					href="/dev/errors/404" />
				<NavItem
					label="Error 403"
					href="/dev/errors/403" />
				<NavItem
					label="Error 500"
					href="/dev/errors/500" />
			</NavGroup>
		{/if}
	</div>
</div>

<main class="min-h-screen bg-bg pt-(--banner-height) pl-80 font-sans text-text">
	<div
		id="top"
		class="content-area mx-auto px-6 py-10 {wideContent
			? 'content-wide max-w-5xl'
			: 'max-w-3xl'}">
		<div class="relative">
			{@render children()}

			<!-- Floats beside any page that renders an <article>; renders nothing elsewhere.
			     YAML views omit it because they replace the page headings with source. -->
			<div class="toc-float">
				<div class="toc-sticky">
					{#if !yamlView}
						{#key page.url.pathname}
							<TableOfContents />
						{/key}
					{/if}
				</div>
			</div>
		</div>
	</div>
</main>

<style>
	/* Height of the work-in-progress banner, zero when it is switched off.
	   Anchor jumps land below it. */
	:global(:root) {
		--banner-height: 0px;
		scroll-padding-top: var(--banner-height);
	}

	:global(:root:has(.wip-banner)) {
		--banner-height: 2.25rem;
	}

	.toc-float {
		display: none;
		position: absolute;
		top: 0;
		left: 100%;
		margin-left: 2rem;
	}

	.toc-sticky {
		position: fixed;
		top: calc(var(--banner-height) + 2rem);
		max-height: calc(100vh - var(--banner-height) - 4rem);
		overflow-y: auto;
	}

	/* The TOC floats once the column plus the panel fit beside the sidebar.
	   Content is shifted left by half the panel's footprint so the pair
	   reads as centered. Wide columns need the larger breakpoint. */
	@media (min-width: 1280px) {
		.content-area:not(.content-wide) {
			margin-left: calc(50% - 24rem - 9rem);
			margin-right: auto;
		}

		.content-area:not(.content-wide) .toc-float {
			display: block;
		}
	}

	@media (min-width: 1600px) {
		.content-wide {
			margin-left: calc(50% - 32rem - 9rem);
			margin-right: auto;
		}

		.content-wide .toc-float {
			display: block;
		}
	}
</style>

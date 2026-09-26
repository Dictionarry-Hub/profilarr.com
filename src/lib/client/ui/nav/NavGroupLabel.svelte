<script lang="ts">
	import { page } from '$app/state';
	import { slide } from 'svelte/transition';
	import type { Component, Snippet } from 'svelte';

	interface Props {
		label: string;
		/** Makes the label a link to the section's own page. */
		href?: string;
		icon?: Component<{ size?: number; class?: string }>;
		/** `'auto'` opens the section while the current page is inside it. A
		    boolean fixes the starting state instead. */
		open?: boolean | 'auto';
		/** Path prefixes that count as inside the section besides `href`. */
		sectionPaths?: string[];
		children?: Snippet;
	}

	let { label, href, icon, open = true, sectionPaths = [], children }: Props = $props();

	const isActive = $derived(href !== undefined && page.url.pathname === href);

	const isInside = $derived.by(() => {
		const pathname = page.url.pathname;
		const paths = href === undefined ? sectionPaths : [href, ...sectionPaths];
		return paths.some((path) => pathname === path || pathname.startsWith(path + '/'));
	});

	// Same toggle rules as NavGroup: in auto mode a manual toggle lasts until
	// the next navigation, and clicking the label link clears it.
	let toggled = $state<{ open: boolean; path: string } | null>(null);
	const isOpen = $derived.by(() => {
		if (toggled && (open !== 'auto' || toggled.path === page.url.pathname)) {
			return toggled.open;
		}
		return open === 'auto' ? isInside : open;
	});

	function toggleOpen() {
		toggled = { open: !isOpen, path: page.url.pathname };
	}

	function clearToggle() {
		toggled = null;
	}
</script>

{#snippet labelContent()}
	{#if icon}
		{@const Icon = icon}
		<Icon
			size={16}
			class="shrink-0" />
	{/if}
	<span class="flex-1 truncate">{label}</span>
{/snippet}

<!-- NavGroup's split-header language: left names the context, right chevron
     collapses the subtree it scopes. The left side is a link when the section
     has its own page, and a plain label otherwise. -->
<div class="mb-4">
	<div
		class="group/header flex items-center rounded-control border transition-colors
			{isActive ? 'border-border bg-surface shadow-control' : 'border-transparent'}">
		{#if href}
			<a
				{href}
				onclick={clearToggle}
				class="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 pl-3 text-sm font-semibold transition-colors
					{children ? 'rounded-l-control' : 'rounded-control'}
					{isActive ? 'text-text' : 'text-text-soft group-hover/header:bg-surface-hover'}">
				{@render labelContent()}
			</a>
		{:else}
			<div
				class="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 pl-3 text-sm font-semibold text-text-soft">
				{@render labelContent()}
			</div>
		{/if}

		{#if children}
			<button
				type="button"
				onclick={toggleOpen}
				class="flex cursor-pointer items-center self-stretch rounded-control pr-1.5 pl-1.5 transition-colors hover:bg-surface-hover"
				aria-label={isOpen ? 'Collapse group' : 'Expand group'}>
				<svg
					class="size-4 text-text-muted transition-transform {isOpen ? 'rotate-90' : ''}"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 5l7 7-7 7" />
				</svg>
			</button>
		{/if}
	</div>

	<!-- Children with vertical connector, matching NavGroup -->
	{#if isOpen && children}
		<div
			class="mt-2 grid grid-cols-[auto_1fr]"
			transition:slide={{ duration: 200 }}>
			<div class="flex justify-center px-5">
				<div class="w-0.5 rounded-pill bg-border-muted"></div>
			</div>
			<div class="-ml-3 flex flex-col gap-1">
				{@render children()}
			</div>
		</div>
	{/if}
</div>

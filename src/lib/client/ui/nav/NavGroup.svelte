<script lang="ts">
	import { page } from '$app/state';
	import { slide } from 'svelte/transition';
	import type { Component, Snippet } from 'svelte';

	interface Props {
		label: string;
		href: string;
		icon?: Component<{ size?: number; class?: string }>;
		badge?: number;
		/** `'auto'` opens the group while the current page is inside it. A
		    boolean fixes the starting state instead. */
		open?: boolean | 'auto';
		/** Pages that count as inside the group without sharing its `href`
		    prefix, such as docs pages with flat URLs. */
		childHrefs?: string[];
		class?: string;
		children?: Snippet;
	}

	let {
		label,
		href,
		icon,
		badge = 0,
		open = 'auto',
		childHrefs = [],
		class: className,
		children
	}: Props = $props();

	const hasItems = $derived(!!children);

	const isInside = $derived.by(() => {
		const pathname = page.url.pathname;
		return (
			pathname === href || pathname.startsWith(href + '/') || childHrefs.includes(pathname)
		);
	});

	// In auto mode a manual toggle lasts until the next navigation, so it is
	// stored with the path it was made on. With a fixed `open` it sticks.
	let toggled = $state<{ open: boolean; path: string } | null>(null);
	const isOpen = $derived.by(() => {
		if (toggled && (open !== 'auto' || toggled.path === page.url.pathname)) {
			return toggled.open;
		}
		return open === 'auto' ? isInside : open;
	});

	const isActive = $derived.by(() => {
		const pathname = page.url.pathname;
		if (hasItems) {
			return pathname === href;
		}
		return pathname === href || pathname.startsWith(href + '/');
	});

	function toggleOpen() {
		toggled = { open: !isOpen, path: page.url.pathname };
	}

	// Clicking the header link drops any manual toggle, so a group you closed
	// by hand opens again even when you are already on its page.
	function clearToggle() {
		toggled = null;
	}
</script>

<div class={className ?? 'mb-4'}>
	<!-- Split header -->
	<div
		class="group/header flex items-center rounded-control border transition-colors
			{isActive ? 'border-border bg-surface shadow-control' : 'border-transparent'}">
		<!-- Link side -->
		<a
			{href}
			onclick={clearToggle}
			class="flex flex-1 items-center gap-2 py-1.5 pr-2 pl-3 text-sm font-semibold transition-colors
				{hasItems ? 'rounded-l-control' : 'rounded-control'}
				{isActive ? 'text-text' : 'text-text-soft group-hover/header:bg-surface-hover'}">
			{#if icon}
				{@const Icon = icon}
				<Icon
					size={16}
					class="shrink-0" />
			{/if}
			<span class="flex-1">{label}</span>
			{#if badge > 0}
				<span
					class="inline-flex min-w-5 items-center justify-center rounded-pill bg-accent-solid px-1.5 py-0.5 text-xs font-medium text-on-accent">
					{badge}
				</span>
			{/if}
		</a>

		<!-- Chevron toggle -->
		{#if hasItems}
			<button
				type="button"
				onclick={toggleOpen}
				class="flex cursor-pointer items-center self-stretch rounded-r-control pr-1.5 pl-1.5 transition-colors
					{isActive
					? 'hover:bg-surface-hover'
					: 'group-hover/header:bg-surface-hover hover:!bg-surface-hover-muted'}"
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

	<!-- Children with vertical connector -->
	{#if isOpen && hasItems && children}
		<div
			class="mt-2 grid grid-cols-[auto_1fr]"
			transition:slide={{ duration: 200 }}>
			<!-- Vertical line -->
			<div class="flex justify-center px-5">
				<div class="w-0.5 rounded-pill bg-border-muted"></div>
			</div>

			<!-- Items -->
			<div class="-ml-3 flex flex-col gap-1">
				{@render children()}
			</div>
		</div>
	{/if}
</div>

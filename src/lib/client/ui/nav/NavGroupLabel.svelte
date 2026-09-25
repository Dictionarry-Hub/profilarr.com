<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { Component, Snippet } from 'svelte';

	interface Props {
		label: string;
		icon?: Component<{ size?: number; class?: string }>;
		open?: boolean;
		children?: Snippet;
	}

	let { label, icon, open = true, children }: Props = $props();

	let toggled = $state<boolean | null>(null);
	const isOpen = $derived(toggled ?? open);

	function toggleOpen() {
		toggled = !isOpen;
	}
</script>

<!-- NavGroup's split-header language, with the link side replaced by a
     plain label: left names the context, right chevron collapses the
     subtree it scopes. -->
<div class="mb-4">
	<div class="flex items-center rounded-control border border-transparent">
		<div
			class="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 pl-3 text-sm font-semibold text-text-soft">
			{#if icon}
				{@const Icon = icon}
				<Icon
					size={16}
					class="shrink-0" />
			{/if}
			<span class="flex-1 truncate">{label}</span>
		</div>

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

<script lang="ts">
	import type { Component, Snippet } from 'svelte';

	interface TabItem {
		id: string;
		label: string;
		icon?: Component<{ class?: string }>;
	}

	interface Props {
		items: TabItem[];
		/** Id of the selected tab. Defaults to the first. */
		value?: string;
		/** Accessible name for the tab list. */
		label: string;
		/** Renders the selected tab's panel. */
		panel: Snippet<[TabItem]>;
		class?: string;
	}

	let {
		items,
		value = $bindable(items[0]?.id),
		label,
		panel,
		class: className
	}: Props = $props();

	const uid = $props.id();
	const selected = $derived(items.find((item) => item.id === value) ?? items[0]);

	let tabs: HTMLButtonElement[] = $state([]);

	// Arrow keys move between tabs, Home and End jump to the ends, as in the
	// WAI-ARIA tabs pattern. Selection follows focus.
	function onKeydown(event: KeyboardEvent, index: number) {
		const last = items.length - 1;
		const next =
			event.key === 'ArrowRight'
				? (index + 1) % items.length
				: event.key === 'ArrowLeft'
					? (index - 1 + items.length) % items.length
					: event.key === 'Home'
						? 0
						: event.key === 'End'
							? last
							: null;
		if (next === null) return;
		event.preventDefault();
		value = items[next].id;
		tabs[next]?.focus();
	}
</script>

<div class={className}>
	<div
		role="tablist"
		aria-label={label}
		class="flex flex-wrap gap-1 border-b border-border-muted">
		{#each items as item, index (item.id)}
			{@const active = item.id === selected?.id}
			<button
				bind:this={tabs[index]}
				type="button"
				role="tab"
				id="{uid}-tab-{item.id}"
				aria-selected={active}
				aria-controls="{uid}-panel"
				tabindex={active ? 0 : -1}
				class="-mb-px flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors {active
					? 'border-accent-solid text-accent-text'
					: 'border-transparent text-text-muted hover:border-border hover:text-text'}"
				onclick={() => (value = item.id)}
				onkeydown={(event) => onKeydown(event, index)}>
				{#if item.icon}
					{@const Icon = item.icon}
					<Icon class="size-4" />
				{/if}
				{item.label}
			</button>
		{/each}
	</div>

	{#if selected}
		<div
			role="tabpanel"
			id="{uid}-panel"
			aria-labelledby="{uid}-tab-{selected.id}"
			class="mt-4">
			{@render panel(selected)}
		</div>
	{/if}
</div>

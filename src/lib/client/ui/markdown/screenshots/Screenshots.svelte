<script lang="ts">
	import Tabs from '$lib/client/ui/tabs/Tabs.svelte';
	import ThemeImage from '$lib/client/ui/markdown/image/ThemeImage.svelte';
	import type { Screenshot } from '$lib/shared/utils/llm/components.js';

	interface Props {
		items: Screenshot[];
		/** Accessible name for the tab list. */
		label?: string;
	}

	let { items, label = 'Screenshots' }: Props = $props();

	const tabs = $derived(
		items.map((item) => ({ id: item.label, label: item.label, icon: item.icon }))
	);
</script>

<div class="screenshots my-6">
	<Tabs
		items={tabs}
		{label}>
		{#snippet panel(tab)}
			{@const item = items.find((candidate) => candidate.label === tab.id)!}
			{#if item.light && item.dark}
				<ThemeImage
					light={item.light}
					dark={item.dark}
					alt={item.alt}
					border={item.border} />
			{:else}
				<div
					class="flex aspect-video items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted font-mono text-xs text-text-muted">
					Screenshot: {item.label}
				</div>
			{/if}
			{#if item.caption}
				<p class="mt-3 text-center text-xs text-text-muted">{item.caption}</p>
			{/if}
		{/snippet}
	</Tabs>
</div>

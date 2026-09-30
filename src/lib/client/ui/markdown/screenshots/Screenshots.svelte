<script lang="ts">
	import Tabs from '$lib/client/ui/tabs/Tabs.svelte';
	import ThemeImage from '$lib/client/ui/markdown/image/ThemeImage.svelte';
	import ImagePreview from '$lib/client/ui/markdown/image/ImagePreview.svelte';
	import { captionParts } from '$lib/client/ui/markdown/image/caption';
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

	// The preview steps through every tab that has an image. Stepping in the
	// preview also switches the tab, so closing it leaves the reader on the
	// screenshot they last viewed.
	const previewable = $derived(
		items.flatMap((item) =>
			item.light && item.dark
				? [{ ...item, title: item.label, light: item.light, dark: item.dark }]
				: []
		)
	);

	// Empty until a tab is chosen; Tabs shows the first tab meanwhile. It can't
	// start undefined, since binding undefined to a prop with a fallback throws.
	let active = $state('');
	let previewOpen = $state(false);
	let previewIndex = $state(0);

	function openPreview(itemLabel: string) {
		previewIndex = Math.max(
			0,
			previewable.findIndex((item) => item.label === itemLabel)
		);
		previewOpen = true;
	}

	$effect(() => {
		const shown = previewable[previewIndex];
		if (previewOpen && shown) active = shown.label;
	});
</script>

<div class="screenshots my-6">
	<Tabs
		items={tabs}
		bind:value={active}
		{label}>
		{#snippet panel(tab)}
			{@const item = items.find((candidate) => candidate.label === tab.id)!}
			{#if item.light && item.dark}
				<ThemeImage
					light={item.light}
					dark={item.dark}
					alt={item.alt}
					caption={item.caption}
					border={item.border}
					onpreview={() => openPreview(item.label)} />
			{:else}
				<div
					class="flex aspect-video items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted font-mono text-xs text-text-muted">
					Screenshot: {item.label}
				</div>
				{#if item.caption}
					<p class="mt-3 text-center text-xs text-text-muted">
						{#each captionParts(item.caption) as part, i (i)}{#if part.code}<code
									>{part.text}</code
								>{:else}{part.text}{/if}{/each}
					</p>
				{/if}
			{/if}
		{/snippet}
	</Tabs>

	<ImagePreview
		bind:open={previewOpen}
		bind:index={previewIndex}
		images={previewable} />
</div>

<style>
	/* The tab panel already spaces its content, so a captioned image's figure
	   drops its own margin. */
	.screenshots :global(.theme-figure) {
		margin-block: 0;
	}
</style>

<script lang="ts">
	import { ChevronLeft, ChevronRight, X } from '@lucide/svelte';
	import Button from '$lib/client/ui/button/Button.svelte';
	import Dialog from '$lib/client/ui/dialog/Dialog.svelte';
	import ThemeImage from './ThemeImage.svelte';
	import { captionParts } from './caption';
	import type { Component } from 'svelte';

	interface PreviewImage {
		light: string;
		dark: string;
		alt: string;
		/** Shown in the top left, such as the Screenshots tab the image is from. */
		title?: string;
		/** Icon beside the title. */
		icon?: Component<{ class?: string }>;
		caption?: string;
		border?: boolean;
	}

	interface Props {
		/** Bindable. */
		open?: boolean;
		images: PreviewImage[];
		/** Bindable. Index of the image shown. */
		index?: number;
	}

	let { open = $bindable(false), images, index = $bindable(0) }: Props = $props();

	const image = $derived(images[index] ?? images[0]);
	const many = $derived(images.length > 1);

	function step(by: number) {
		index = (index + by + images.length) % images.length;
	}

	// With no panel, the space around the image looks like backdrop, so a click
	// there closes the preview too. Clicks on the image and buttons land on
	// those elements instead.
	function closeOnEmpty(event: MouseEvent) {
		if (event.target === event.currentTarget) open = false;
	}

	function onKeydown(event: KeyboardEvent) {
		if (!open || !many) return;
		if (event.key === 'ArrowLeft') step(-1);
		else if (event.key === 'ArrowRight') step(1);
		else return;
		event.preventDefault();
	}
</script>

<svelte:window onkeydown={onKeydown} />

<!-- Rendered only while open, so a preview inside a paragraph never puts a
     <dialog> in the server-rendered HTML, where it would be invalid. -->
{#if open && image}
	<Dialog
		bind:open
		ariaLabel={image.alt}
		bare
		class="image-preview w-[min(94vw,1600px)]">
		<!-- Escape closes it from the keyboard; the click only mirrors the backdrop. -->
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div
			class="relative p-3 text-center"
			onclick={closeOnEmpty}>
			<!-- The figure shrinks to the image, so the title bar and caption line
			     up with the image's edges. Their zero width keeps long text from
			     widening the figure past the image. -->
			<figure class="inline-block max-w-full text-left align-top">
				<div class="mb-3 flex w-0 min-w-full items-center justify-between gap-4">
					<span class="flex items-center gap-2 font-medium text-text">
						{#if image.icon}
							{@const Icon = image.icon}
							<Icon class="size-4 text-text-muted" />
						{/if}
						{image.title ?? ''}
					</span>
					<Button
						type="button"
						icon={X}
						aria-label="Close preview"
						onclick={() => (open = false)} />
				</div>
				<ThemeImage
					light={image.light}
					dark={image.dark}
					alt={image.alt}
					border={image.border}
					preview={false}
					class="max-h-[80vh] max-w-full rounded-card object-contain" />
				{#if image.caption || many}
					<figcaption
						class="mt-3 flex w-0 min-w-full items-start justify-between gap-4 text-sm text-text-soft">
						<span
							>{#each captionParts(image.caption ?? '') as part, i (i)}{#if part.code}<code
										>{part.text}</code
									>{:else}{part.text}{/if}{/each}</span>
						{#if many}
							<span class="shrink-0 font-mono">{index + 1} / {images.length}</span>
						{/if}
					</figcaption>
				{/if}
			</figure>

			{#if many}
				<Button
					type="button"
					icon={ChevronLeft}
					aria-label="Previous image"
					class="absolute top-1/2 left-5 -translate-y-1/2"
					onclick={() => step(-1)} />
				<Button
					type="button"
					icon={ChevronRight}
					aria-label="Next image"
					class="absolute top-1/2 right-5 -translate-y-1/2"
					onclick={() => step(1)} />
			{/if}
		</div>
	</Dialog>
{/if}

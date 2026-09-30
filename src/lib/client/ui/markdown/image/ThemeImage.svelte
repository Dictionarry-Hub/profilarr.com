<script lang="ts">
	import ImagePreview from './ImagePreview.svelte';

	interface Props {
		dark: string;
		light: string;
		alt: string;
		/** Shown below the image, and below it in the preview. */
		caption?: string;
		/** Outlines the image, for screenshots whose background matches the page. */
		border?: boolean;
		/** Opens a larger preview on click. */
		preview?: boolean;
		/** Replaces the built-in preview, for components that preview a set of
		    images together, such as Screenshots. */
		onpreview?: () => void;
		class?: string;
	}

	let {
		dark,
		light,
		alt,
		caption,
		border = false,
		preview = true,
		onpreview,
		class: className
	}: Props = $props();

	let open = $state(false);

	const classes = $derived(
		`align-bottom ${border ? 'border border-border' : ''} ${className ?? ''}`
	);

	function openPreview() {
		if (onpreview) onpreview();
		else open = true;
	}
</script>

<!--
	Both images render in the DOM. CSS hides the wrong one based on the
	--theme-image-* display tokens every theme declares, so this component
	never enumerates themes. The inline script in app.html sets data-theme
	before first paint, so no flash. Fallbacks match :root (light).
-->
{#snippet images()}
	<img
		src={light}
		{alt}
		class="theme-img theme-img-light {classes}" />
	<img
		src={dark}
		{alt}
		class="theme-img theme-img-dark {classes}" />
{/snippet}

{#snippet image()}
	{#if preview}
		<button
			type="button"
			aria-label="View larger: {alt}"
			class="theme-img-button cursor-zoom-in rounded-card focus-visible:ring-2 focus-visible:ring-accent-solid focus-visible:outline-none"
			onclick={openPreview}>
			{@render images()}
		</button>
		{#if !onpreview}
			<ImagePreview
				bind:open
				images={[{ light, dark, alt, caption, border }]} />
		{/if}
	{:else}
		{@render images()}
	{/if}
{/snippet}

<!--
	Without a caption the image stays inline, so it can sit inside a paragraph.
	A caption needs a figure, which can't.
-->
{#if caption}
	<figure class="theme-figure my-6">
		{@render image()}
		<figcaption class="mt-3 text-center text-xs text-text-muted">{caption}</figcaption>
	</figure>
{:else}
	{@render image()}
{/if}

<style>
	.theme-img-light {
		display: var(--theme-image-light, inline);
	}

	.theme-img-dark {
		display: var(--theme-image-dark, none);
	}

	.theme-img-button {
		display: inline-block;
		max-width: 100%;
	}
</style>

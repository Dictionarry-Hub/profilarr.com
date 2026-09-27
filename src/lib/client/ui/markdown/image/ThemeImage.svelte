<script lang="ts">
	interface Props {
		dark: string;
		light: string;
		alt: string;
		/** Outlines the image, for screenshots whose background matches the page. */
		border?: boolean;
		class?: string;
	}

	let { dark, light, alt, border = false, class: className }: Props = $props();

	const classes = $derived(`${border ? 'border border-border' : ''} ${className ?? ''}`);
</script>

<!--
	Both images render in the DOM. CSS hides the wrong one based on the
	--theme-image-* display tokens every theme declares, so this component
	never enumerates themes. The inline script in app.html sets data-theme
	before first paint, so no flash. Fallbacks match :root (light).
-->
<img
	src={light}
	{alt}
	class="theme-img theme-img-light {classes}" />
<img
	src={dark}
	{alt}
	class="theme-img theme-img-dark {classes}" />

<style>
	.theme-img-light {
		display: var(--theme-image-light, inline);
	}

	.theme-img-dark {
		display: var(--theme-image-dark, none);
	}
</style>

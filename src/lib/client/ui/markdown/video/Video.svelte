<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		src: string;
		/** Visible caption under the video. */
		title?: string;
		/** What happens in the video, for screen readers and the Markdown mirror. */
		description?: string;
		class?: string;
	}

	let { src, title, description, class: className }: Props = $props();

	const descriptionId = $props.id();

	let videoEl: HTMLVideoElement | undefined = $state();

	onMount(async () => {
		const Plyr = (await import('plyr')).default;
		await import('plyr/dist/plyr.css');
		if (videoEl) new Plyr(videoEl);
	});
</script>

<figure class="mb-6 {className ?? ''}">
	<div class="video-wrapper">
		<video
			bind:this={videoEl}
			aria-describedby={description ? descriptionId : undefined}
			playsinline
			controls>
			<source
				{src}
				type="video/mp4" />
		</video>
	</div>
	{#if description}
		<p
			id={descriptionId}
			class="sr-only">
			{description}
		</p>
	{/if}
	{#if title}
		<figcaption class="mt-2 text-center text-sm text-text-muted">{title}</figcaption>
	{/if}
</figure>

<style>
	.video-wrapper {
		border-radius: var(--theme-radius-card);
		overflow: hidden;

		--plyr-color-main: var(--theme-accent-solid);
		--plyr-video-control-color: #fff;
		--plyr-video-control-color-hover: #fff;
		--plyr-range-thumb-background: #fff;
		--plyr-control-radius: var(--theme-radius-control-sm);
		--plyr-font-family: var(--theme-font-sans);
	}
</style>

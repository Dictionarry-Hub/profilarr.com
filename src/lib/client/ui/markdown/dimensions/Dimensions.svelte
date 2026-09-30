<script lang="ts">
	import { onMount } from 'svelte';
	import { DOT, bounds, clamp, geometry, roundness, shapeAt, type Stage } from './geometry';

	interface Props {
		/** 1 draws a dot out into a line, 2 sweeps the line into a square, and 3
		    turns the camera and extrudes the square into a cube. Each stage starts
		    where the one before it ends. */
		stage: Stage;
		/** Plays every stage from this one up to `stage`, one after another.
		    Defaults to `stage`, which plays only that stage. */
		from?: Stage;
		/** Plays forwards, then backwards, for as long as the figure is in view. */
		loop?: boolean;
		/** What the animation shows, for screen readers and the Markdown mirror. */
		description: string;
		class?: string;
	}

	let { stage, from = stage, loop = false, description, class: className }: Props = $props();

	/** CSS pixels per viewBox unit, so the shape is the same size on every page. */
	const SCALE = 1.5;
	const DURATION: Record<Stage, number> = { 1: 550, 2: 650, 3: 1100 };
	/** Pause after each stage, and at each end of a loop. */
	const HOLD = 200;
	const LOOP_HOLD = 800;
	const DELAY = 200;

	const stages = $derived(
		([1, 2, 3] as Stage[]).filter((s) => s >= Math.min(from, stage) && s <= stage)
	);
	const total = $derived(stages.reduce((sum, s) => sum + DURATION[s] + HOLD, 0));

	/** The shape `time` milliseconds into the stages, holding briefly after each. */
	function shapeAtTime(time: number) {
		let start = 0;
		for (const s of stages) {
			const end = start + DURATION[s] + HOLD;
			if (time < end || s === stage) return shapeAt(s, clamp((time - start) / DURATION[s]));
			start = end;
		}
		return shapeAt(stage, 1);
	}

	/** Loops run the timeline forwards, hold, run it backwards, and hold. */
	function timeAt(elapsed: number): number {
		if (!loop) return elapsed;
		const position = elapsed % (2 * (total + LOOP_HOLD));
		if (position < total) return position;
		if (position < total + LOOP_HOLD) return total;
		if (position < 2 * total + LOOP_HOLD) return 2 * total + LOOP_HOLD - position;
		return 0;
	}

	// Prerendered HTML shows the finished shape; the animation starts from the
	// beginning once the figure scrolls into view.
	let time = $state(Infinity);
	let figure: HTMLElement | undefined = $state();

	const shape = $derived(shapeAtTime(time));
	const current = $derived(geometry(shape));
	const round = $derived(roundness(shape));
	const gradient = $props.id();
	const box = $derived(bounds(stage));

	onMount(() => {
		if (!figure || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		time = 0;
		let frame = 0;
		let elapsed = -DELAY;
		let last = 0;

		const tick = (now: number) => {
			elapsed += now - last;
			last = now;
			time = timeAt(Math.max(0, elapsed));
			if (loop || elapsed < total) frame = requestAnimationFrame(tick);
		};

		// A loop pauses while the figure is out of view; a single play starts
		// once and runs to the end.
		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries.some((entry) => entry.isIntersecting);
				cancelAnimationFrame(frame);
				if (!visible) return;
				if (!loop) observer.disconnect();
				last = performance.now();
				frame = requestAnimationFrame(tick);
			},
			{ threshold: 0.75 }
		);
		observer.observe(figure);
		return () => {
			observer.disconnect();
			cancelAnimationFrame(frame);
		};
	});
</script>

<figure
	bind:this={figure}
	class="my-6 flex justify-center {className ?? ''}">
	<svg
		role="img"
		aria-label={description}
		viewBox="{box.x} {box.y} {box.width} {box.height}"
		width={box.width * SCALE}
		height={box.height * SCALE}
		class="h-auto max-w-full">
		<!-- Lit from the top left: the accent mixed toward white, then toward black
		     at the rim. The dots fade into it as the camera turns. -->
		<defs>
			<radialGradient
				id={gradient}
				cx="35%"
				cy="30%"
				r="75%">
				<stop
					offset="0%"
					class="sphere-light" />
				<stop
					offset="45%"
					class="sphere-base" />
				<stop
					offset="100%"
					class="sphere-shade" />
			</radialGradient>
		</defs>
		{#each current.faces as face, i (i)}
			<polygon
				points={face.points}
				class="fill-accent-bg" />
		{/each}
		{#each current.edges as edge, i (i)}
			<line
				x1={edge.x1}
				y1={edge.y1}
				x2={edge.x2}
				y2={edge.y2}
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-dasharray={edge.hidden ? '3 3' : undefined}
				class={edge.hidden ? 'stroke-border' : 'stroke-accent-solid'} />
		{/each}
		{#each current.dots as dot, i (i)}
			<circle
				cx={dot.x}
				cy={dot.y}
				r={DOT}
				class={dot.hidden ? 'fill-border' : 'fill-accent-solid'} />
			{#if !dot.hidden && round > 0}
				<circle
					cx={dot.x}
					cy={dot.y}
					r={DOT}
					fill="url(#{gradient})"
					opacity={round} />
			{/if}
		{/each}
	</svg>
</figure>

<style>
	.sphere-light {
		stop-color: color-mix(in oklab, var(--theme-accent-solid), white 65%);
	}

	.sphere-base {
		stop-color: var(--theme-accent-solid);
	}

	.sphere-shade {
		stop-color: color-mix(in oklab, var(--theme-accent-solid), black 40%);
	}
</style>

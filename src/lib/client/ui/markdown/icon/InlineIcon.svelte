<script lang="ts">
	import { INLINE_ICONS, type InlineIconName } from './icons';

	interface Props {
		/** Which icon to show, from INLINE_ICONS in icons.ts. */
		icon: InlineIconName;
		/** What the icon stands for, for screen readers and the Markdown mirror. */
		label: string;
	}

	let { icon, label }: Props = $props();

	// An unknown name throws while the page prerenders, which fails the build.
	const Icon = $derived.by(() => {
		const found = INLINE_ICONS[icon];
		if (!found) throw new Error(`Unknown InlineIcon "${icon}"`);
		return found;
	});
</script>

<!-- A <span>, so it can sit inside a paragraph. The icon scales with the text
     around it and takes its color. -->
<span
	role="img"
	aria-label={label}
	class="inline-flex align-[-0.125em]">
	<Icon
		aria-hidden="true"
		class="size-[1em]" />
</span>

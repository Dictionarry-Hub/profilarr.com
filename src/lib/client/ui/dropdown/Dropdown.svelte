<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		position?: 'left' | 'right' | 'middle';
		minWidth?: string;
		width?: string;
		placement?: 'auto' | 'bottom' | 'top';
		triggerEl?: HTMLElement;
		children: Snippet;
		onplacementchange?: (placement: 'bottom' | 'top') => void;
		/** Close the dropdown: fired on page scroll or zoom, since it does not follow its trigger. */
		ondismiss: () => void;
	}

	let {
		position = 'left',
		minWidth = '12rem',
		width,
		placement = 'auto',
		triggerEl,
		children,
		onplacementchange,
		ondismiss
	}: Props = $props();

	const GAP = 8;

	let dropdownEl: HTMLElement | undefined = $state();
	let fixedStyle = $state('');

	function updatePosition() {
		if (!triggerEl || !dropdownEl) return;

		const rect = triggerEl.getBoundingClientRect();
		const resolvedPlacement =
			placement !== 'auto'
				? placement
				: rect.top + rect.height / 2 > window.innerHeight / 2
					? 'top'
					: 'bottom';

		onplacementchange?.(resolvedPlacement);

		const vertical =
			resolvedPlacement === 'top'
				? `bottom: ${window.innerHeight - rect.top + GAP}px;`
				: `top: ${rect.bottom + GAP}px;`;

		let left: number;
		if (position === 'right') {
			left = rect.right - dropdownEl.offsetWidth;
		} else if (position === 'middle') {
			left = rect.left + rect.width / 2 - dropdownEl.offsetWidth / 2;
		} else {
			left = rect.left;
		}

		fixedStyle = `${vertical} left: ${left}px;`;
	}

	$effect(() => {
		if (triggerEl && dropdownEl) {
			updatePosition();
		}
	});

	// Position is computed once, so any scroll outside the dropdown or any
	// zoom (window resize, or visual viewport resize for pinch) dismisses it.
	$effect(() => {
		function onScroll(event: Event) {
			if (event.target instanceof Node && dropdownEl?.contains(event.target)) return;
			ondismiss();
		}
		function onResize() {
			ondismiss();
		}
		window.addEventListener('scroll', onScroll, { capture: true, passive: true });
		window.addEventListener('resize', onResize);
		window.visualViewport?.addEventListener('resize', onResize);
		return () => {
			window.removeEventListener('scroll', onScroll, { capture: true });
			window.removeEventListener('resize', onResize);
			window.visualViewport?.removeEventListener('resize', onResize);
		};
	});

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.parentNode?.removeChild(node);
			}
		};
	}
</script>

<div
	use:portal
	bind:this={dropdownEl}
	class="fixed z-50 overflow-hidden rounded-card border border-border bg-bg shadow-card"
	style="min-width: {minWidth}; {width ? `width: ${width};` : ''} {fixedStyle}">
	<div class="bg-surface">
		{@render children()}
	</div>
</div>

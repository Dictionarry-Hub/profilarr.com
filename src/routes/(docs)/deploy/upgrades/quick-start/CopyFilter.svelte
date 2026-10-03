<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Copy, Check, CircleAlert } from '@lucide/svelte';
	import Button from '$lib/client/ui/button/Button.svelte';
	import Tooltip from '$lib/client/ui/tooltip/Tooltip.svelte';

	let { title, code }: { title: string; code: string } = $props();
	let status = $state<'idle' | 'copied' | 'failed'>('idle');
	let timer: ReturnType<typeof setTimeout> | undefined;

	const icon = $derived(status === 'copied' ? Check : status === 'failed' ? CircleAlert : Copy);
	const label = $derived(
		status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy Failed' : 'Copy Filter'
	);

	async function copy() {
		try {
			await navigator.clipboard.writeText(code.trim());
			status = 'copied';
		} catch {
			status = 'failed';
		}
		clearTimeout(timer);
		timer = setTimeout(() => (status = 'idle'), 2000);
	}

	onDestroy(() => clearTimeout(timer));
</script>

<Tooltip text={label}>
	<Button
		type="button"
		size="sm"
		{icon}
		iconClass={status === 'copied' ? 'text-success-icon' : ''}
		aria-label={`Copy ${title} filter`}
		onclick={copy} />
</Tooltip>
<span class="sr-only" aria-live="polite">{status === 'idle' ? '' : label}</span>

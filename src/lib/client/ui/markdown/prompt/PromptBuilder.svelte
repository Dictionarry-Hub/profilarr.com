<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Copy, Check, CircleAlert } from '@lucide/svelte';
	import Button from '$lib/client/ui/button/Button.svelte';
	import Tooltip from '$lib/client/ui/tooltip/Tooltip.svelte';
	import type { CodeExample } from '$lib/shared/utils/llm/components';
	import { populatePrompt } from '$lib/shared/utils/llm/prompt';

	let { prompt, placeholder = '' }: { prompt: CodeExample; placeholder?: string } = $props();
	const id = $props.id();
	let description = $state('');
	let status = $state<'idle' | 'copied' | 'failed'>('idle');
	let timer: ReturnType<typeof setTimeout> | undefined;
	let disposed = false;

	const icon = $derived(status === 'copied' ? Check : status === 'failed' ? CircleAlert : Copy);
	const label = $derived(
		status === 'copied' ? 'Copied' : status === 'failed' ? 'Try Copying Again' : 'Copy AI Prompt'
	);

	function resetStatus() {
		clearTimeout(timer);
		status = 'idle';
	}

	async function copy() {
		if (!description.trim()) return;
		const currentDescription = description;
		let result: 'copied' | 'failed';
		try {
			await navigator.clipboard.writeText(populatePrompt(prompt.code, currentDescription));
			result = 'copied';
		} catch {
			result = 'failed';
		}
		if (disposed || description !== currentDescription) return;
		status = result;
		clearTimeout(timer);
		timer = setTimeout(() => (status = 'idle'), 3000);
	}

	onDestroy(() => {
		disposed = true;
		clearTimeout(timer);
	});
</script>

<div class="mb-5">
	<label
		for={id}
		class="mb-2 block text-sm font-medium text-text">Description</label>
	<div class="relative overflow-hidden rounded-control border border-border bg-surface shadow-control focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent-bg">
		<textarea
			{id}
			bind:value={description}
			{placeholder}
			rows="4"
			class="block w-full resize-y bg-transparent py-3 pr-12 pl-3 text-sm text-text placeholder:text-text-muted focus:outline-none"
			oninput={resetStatus} />
		<div class="absolute top-2 right-2">
			<Tooltip text={label} position="top">
				<Button
					type="button"
					size="sm"
					{icon}
					iconClass={status === 'copied' ? 'text-success-icon' : ''}
					aria-label={label}
					disabled={!description.trim()}
					onclick={copy} />
			</Tooltip>
		</div>
	</div>
	<span class="sr-only" aria-live="polite">
		{#if status === 'copied'}
			Prompt copied. Paste it into your preferred AI.
		{:else if status === 'failed'}
			Couldn't copy the prompt. Try again.
		{/if}
	</span>
</div>

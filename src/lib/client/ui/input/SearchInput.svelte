<script lang="ts">
	import { browser } from '$app/environment';
	import { Search, X } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import Button from '$lib/client/ui/button/Button.svelte';
	import Dialog from '$lib/client/ui/dialog/Dialog.svelte';
	import Kbd from '$lib/client/ui/kbd/Kbd.svelte';
	import Tooltip from '$lib/client/ui/tooltip/Tooltip.svelte';

	interface Props {
		value: string;
		placeholder?: string;
		/** Placeholder inside the popup, where there is room for more detail. */
		popupPlaceholder?: string;
		label?: string;
		/**
		 * inline: a text field. popup: a button that opens the field in a dialog.
		 * responsive: inline at lg and up, popup below.
		 */
		mode?: 'inline' | 'popup' | 'responsive';
		/** A single key, optionally prefixed with `mod+` for Ctrl or Cmd: '/' or 'mod+k'. */
		shortcut?: string;
		rounded?: 'all' | 'left' | 'right';
		/** Bindable. Whether the popup dialog is open. */
		open?: boolean;
		/** Popup body, rendered under the field. */
		results?: Snippet;
		/** Fixed region under the popup body, e.g. keyboard hints. */
		footer?: Snippet;
		/** Runs on keydown in either field, after the built-in handling. */
		onkeydown?: (event: KeyboardEvent) => void;
		class?: string;
	}

	let {
		value = $bindable(),
		placeholder = 'Search...',
		popupPlaceholder,
		label,
		mode = 'inline',
		shortcut,
		rounded = 'all',
		open = $bindable(false),
		results,
		footer,
		onkeydown,
		class: className = ''
	}: Props = $props();

	const roundedClasses: Record<NonNullable<Props['rounded']>, string> = {
		all: 'rounded-control',
		left: 'rounded-l-control',
		right: 'rounded-r-control'
	};

	const boxClass =
		'items-center gap-2 border border-border bg-surface px-3 py-1.5 text-sm shadow-control transition-colors';

	let inlineInput: HTMLInputElement | undefined = $state();
	let popupInput: HTMLInputElement | undefined = $state();

	// browser-guarded: navigator does not exist at prerender time.
	const isMac = $derived(browser && /Mac|iPhone|iPad/i.test(navigator.platform));

	const parsedShortcut = $derived.by(() => {
		if (!shortcut) return null;
		const mod = shortcut.toLowerCase().startsWith('mod+');
		return { mod, key: (mod ? shortcut.slice(4) : shortcut).toLowerCase() };
	});

	const shortcutLabel = $derived.by(() => {
		if (!parsedShortcut) return null;
		const key = parsedShortcut.key.toUpperCase();
		if (!parsedShortcut.mod) return key;
		return isMac ? `⌘${key}` : `Ctrl ${key}`;
	});

	function isEditable(target: EventTarget | null): boolean {
		if (!(target instanceof HTMLElement)) return false;
		return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
	}

	// Plain-key shortcuts stand down while the user is typing elsewhere;
	// modifier shortcuts always fire.
	function onWindowKeydown(event: KeyboardEvent) {
		if (!parsedShortcut || event.defaultPrevented) return;
		if (event.key.toLowerCase() !== parsedShortcut.key) return;
		const modHeld = event.ctrlKey || event.metaKey;
		if (parsedShortcut.mod ? !modHeld : modHeld || event.altKey || isEditable(event.target)) {
			return;
		}
		event.preventDefault();
		activate();
	}

	// A modifier shortcut toggles an open popup closed, like the palettes it
	// imitates. In responsive mode the inline field is hidden below lg, and a
	// hidden element has no offsetParent.
	function activate() {
		if (open) {
			if (parsedShortcut?.mod) open = false;
		} else if (inlineInput && inlineInput.offsetParent !== null) {
			inlineInput.focus();
			inlineInput.select();
		} else if (mode !== 'inline') {
			open = true;
		}
	}

	function clear() {
		value = '';
		(open ? popupInput : inlineInput)?.focus();
	}

	function onInlineKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && value) {
			event.preventDefault();
			clear();
		}
		onkeydown?.(event);
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#snippet trailing()}
	{#if value}
		<Button
			type="button"
			variant="ghost"
			size="sm"
			icon={X}
			aria-label="Clear search"
			class="-my-1 -mr-1.5 shrink-0"
			onclick={clear} />
	{:else if shortcutLabel}
		<Tooltip text="Press {shortcutLabel} to search">
			<Kbd variant="outline">{shortcutLabel}</Kbd>
		</Tooltip>
	{/if}
{/snippet}

{#if mode !== 'popup'}
	<div
		class="{boxClass} {roundedClasses[rounded]} {mode === 'responsive'
			? 'hidden lg:flex'
			: 'flex'} {className}">
		<Search
			size={14}
			class="shrink-0 text-text-muted" />
		<!-- 16px+ font below sm so iOS does not zoom the page on focus -->
		<input
			bind:this={inlineInput}
			bind:value
			type="text"
			{placeholder}
			aria-label={label ?? placeholder}
			class="w-full min-w-0 bg-transparent text-base text-text outline-none placeholder:text-text-muted sm:text-sm"
			onkeydown={onInlineKeydown} />
		{@render trailing()}
	</div>
{/if}

{#if mode !== 'inline'}
	<!-- The trigger shows the current query, so a filter set in the popup stays visible. -->
	<div
		class="{boxClass} {roundedClasses[rounded]} hover:bg-surface-hover {mode === 'responsive'
			? 'flex lg:hidden'
			: 'flex'} {className}">
		<button
			type="button"
			aria-haspopup="dialog"
			class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
			onclick={() => (open = true)}>
			<Search
				size={14}
				class="shrink-0 text-text-muted" />
			<span class="flex-1 truncate {value ? 'text-text' : 'text-text-muted'}">
				{value || placeholder}
			</span>
		</button>
		{@render trailing()}
	</div>

	<Dialog
		bind:open
		ariaLabel={label ?? placeholder}
		class="mt-[12svh] mb-auto max-h-[60svh] w-full max-w-xl"
		{footer}>
		{#snippet header()}
			<div class="flex items-center gap-3 px-4 py-3">
				<Search
					size={18}
					class="shrink-0 text-text-muted" />
				<!-- 16px+ font so iOS does not zoom the dialog on focus -->
				<input
					bind:this={popupInput}
					bind:value
					type="text"
					placeholder={popupPlaceholder ?? placeholder}
					aria-label={label ?? placeholder}
					class="w-full bg-transparent text-base text-text outline-none placeholder:text-text-muted"
					{onkeydown} />
				{#if value}
					<Button
						type="button"
						variant="ghost"
						size="sm"
						icon={X}
						aria-label="Clear search"
						class="shrink-0"
						onclick={clear} />
				{/if}
			</div>
		{/snippet}
		{@render results?.()}
	</Dialog>
{/if}

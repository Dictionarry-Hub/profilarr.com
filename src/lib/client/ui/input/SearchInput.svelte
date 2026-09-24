<script lang="ts">
	import { browser } from '$app/environment';
	import { Search, X } from '@lucide/svelte';
	import { untrack, type Snippet } from 'svelte';
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
		/** Rendered inside the field before the text, e.g. filter badges. */
		leading?: Snippet;
		/** Message shown under the field. */
		error?: string;
		/** Increment to shake the visible field, e.g. to reject input. */
		shakes?: number;
		/** Shows the clear button even when the text is empty. */
		clearable?: boolean;
		/** Runs after the clear button empties the text. */
		onclear?: () => void;
		/** Popup body, rendered under the field. */
		results?: Snippet;
		/** Fixed region under the popup body, e.g. keyboard hints. */
		footer?: Snippet;
		/** Runs on keydown in either field; preventDefault() skips the built-in handling. */
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
		leading,
		error,
		shakes = 0,
		clearable = false,
		onclear,
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
		'flex-wrap items-center gap-2 border border-border bg-surface px-3 py-1.5 text-sm shadow-control transition-colors';

	let inlineBox: HTMLDivElement | undefined = $state();
	let inlineInput: HTMLInputElement | undefined = $state();
	let popupRow: HTMLDivElement | undefined = $state();
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
		onclear?.();
		(open ? popupInput : inlineInput)?.focus();
	}

	function onInlineKeydown(event: KeyboardEvent) {
		onkeydown?.(event);
		if (event.defaultPrevented) return;
		if (event.key === 'Escape' && value) {
			event.preventDefault();
			clear();
		}
	}

	// Leading badges come before the input, so the dialog's default focus
	// (first focusable element) would land on a badge. Focus the input once
	// Dialog has run showModal().
	$effect(() => {
		if (!open) return;
		queueMicrotask(() => popupInput?.focus());
	});

	// Only a change in the count shakes; opening the popup must not.
	$effect(() => {
		if (shakes === 0) return;
		untrack(shake);
	});

	function shake() {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const target = open ? popupRow : inlineBox;
		target?.animate(
			[
				{ transform: 'translateX(0)' },
				{ transform: 'translateX(-4px)' },
				{ transform: 'translateX(4px)' },
				{ transform: 'translateX(-4px)' },
				{ transform: 'translateX(0)' }
			],
			{ duration: 250, easing: 'ease-in-out' }
		);
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#snippet trailing()}
	{#if value || clearable}
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

{#snippet errorMessage()}
	{#if error}
		<p
			role="alert"
			class="mt-1.5 text-xs text-danger-text">
			{error}
		</p>
	{/if}
{/snippet}

{#if mode !== 'popup'}
	<div class="{mode === 'responsive' ? 'hidden lg:block' : ''} {className}">
		<div
			bind:this={inlineBox}
			class="flex {boxClass} {roundedClasses[rounded]}">
			<Search
				size={14}
				class="shrink-0 text-text-muted" />
			{@render leading?.()}
			<!-- 16px+ font below sm so iOS does not zoom the page on focus -->
			<input
				bind:this={inlineInput}
				bind:value
				type="text"
				{placeholder}
				aria-label={label ?? placeholder}
				class="min-w-32 flex-1 bg-transparent text-base text-text outline-none placeholder:text-text-muted sm:text-sm"
				onkeydown={onInlineKeydown} />
			{@render trailing()}
		</div>
		{@render errorMessage()}
	</div>
{/if}

{#if mode !== 'inline'}
	<!-- The trigger shows the current query, so a filter set in the popup stays visible. -->
	<div
		class="{boxClass} {roundedClasses[rounded]} hover:bg-surface-hover {mode === 'responsive'
			? 'flex lg:hidden'
			: 'flex'} {className}">
		<Search
			size={14}
			class="shrink-0 text-text-muted" />
		{@render leading?.()}
		<button
			type="button"
			aria-haspopup="dialog"
			class="min-w-24 flex-1 cursor-pointer truncate text-left {value
				? 'text-text'
				: 'text-text-muted'}"
			onclick={() => (open = true)}>
			{value || placeholder}
		</button>
		{@render trailing()}
	</div>

	<Dialog
		bind:open
		ariaLabel={label ?? placeholder}
		class="mt-[12svh] mb-auto max-h-[60svh] w-full max-w-xl"
		{footer}>
		{#snippet header()}
			<div class="px-4 py-3">
				<div
					bind:this={popupRow}
					class="flex flex-wrap items-center gap-3">
					<Search
						size={18}
						class="shrink-0 text-text-muted" />
					{@render leading?.()}
					<!-- 16px+ font so iOS does not zoom the dialog on focus -->
					<input
						bind:this={popupInput}
						bind:value
						type="text"
						placeholder={popupPlaceholder ?? placeholder}
						aria-label={label ?? placeholder}
						class="min-w-32 flex-1 bg-transparent text-base text-text outline-none placeholder:text-text-muted"
						{onkeydown} />
					{#if value || clearable}
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
				{@render errorMessage()}
			</div>
		{/snippet}
		{@render results?.()}
	</Dialog>
{/if}

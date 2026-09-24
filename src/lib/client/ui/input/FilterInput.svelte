<script
	lang="ts"
	generics="T">
	import { X } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import Badge from '$lib/client/ui/badge/Badge.svelte';
	import Dropdown from '$lib/client/ui/dropdown/Dropdown.svelte';
	import Kbd from '$lib/client/ui/kbd/Kbd.svelte';
	import Tooltip from '$lib/client/ui/tooltip/Tooltip.svelte';
	import {
		commitInput,
		describeRule,
		parseToken,
		plainTextRules,
		replaceLastToken,
		sameRule,
		suggest,
		tokenize,
		type FilterField,
		type FilterRule,
		type FilterSuggestion
	} from '$lib/shared/utils/filter/rules';
	import SearchInput from './SearchInput.svelte';

	interface Props {
		fields: FilterField<T>[];
		/** Bindable. Committed rules, rendered as badges. */
		rules?: FilterRule[];
		/** Bindable. Text still being typed. */
		value?: string;
		/**
		 * Bindable, written by the component: the committed rules plus the plain
		 * words being typed, debounced. Filter rows with this.
		 */
		active?: FilterRule[];
		/** Milliseconds typing must pause before plain words filter. */
		debounce?: number;
		placeholder?: string;
		mode?: 'inline' | 'popup' | 'responsive';
		shortcut?: string;
		rounded?: 'all' | 'left' | 'right';
		/** Popup body under the suggestions, e.g. the matching rows. */
		results?: Snippet;
		/** Rendered flush against the right of the field; pair with rounded="left". */
		append?: Snippet;
		class?: string;
	}

	let {
		fields,
		rules = $bindable([]),
		value = $bindable(''),
		// eslint-disable-next-line no-useless-assignment -- write-only bindable, read by the parent
		active = $bindable([]),
		debounce = 150,
		placeholder = 'Filter...',
		mode = 'inline',
		shortcut,
		rounded = 'all',
		results,
		append,
		class: className = ''
	}: Props = $props();

	let open = $state(false);
	let focused = $state(false);
	let highlight = $state(-1);
	let shakes = $state(0);
	// Both are pinned to the text they happened on, so typing clears them.
	let rejected = $state<{ input: string; message: string } | null>(null);
	let dismissedAt = $state<string | null>(null);
	let wrapperEl: HTMLDivElement | undefined = $state();
	let wrapperWidth = $state(0);

	const error = $derived(rejected?.input === value ? rejected.message : undefined);
	const suggestions = $derived(focused && dismissedAt !== value ? suggest(value, fields) : []);
	const showDropdown = $derived(!open && suggestions.length > 0);

	const lastToken = $derived.by(() => {
		if (/\s$/.test(value)) return '';
		const tokens = tokenize(value) ?? tokenize(`${value}"`) ?? [];
		return tokens[tokens.length - 1] ?? '';
	});

	// Rules being typed never filter; plain words do, once typing pauses.
	let settled = $state('');
	$effect(() => {
		const current = value;
		const timer = setTimeout(() => (settled = current), debounce);
		return () => clearTimeout(timer);
	});
	$effect(() => {
		active = [...rules, ...plainTextRules(settled, fields)];
	});

	// A half-typed rule highlights the first suggestion so Enter completes it;
	// a complete rule leaves nothing highlighted so Enter commits it.
	$effect(() => {
		const incomplete = lastToken !== '' && !parseToken(lastToken, fields).ok;
		highlight = incomplete && suggestions.length > 0 ? 0 : -1;
	});

	function commit() {
		const text = value.trim();
		if (!text) return;
		const result = commitInput(text, fields);
		if (!result.ok) {
			rejected = { input: value, message: result.error };
			shakes += 1;
			return;
		}
		const fresh = result.rules.filter(
			(rule) => !rules.some((existing) => sameRule(existing, rule))
		);
		rules = [...rules, ...fresh];
		value = result.remaining;
	}

	function pick(suggestion: FilterSuggestion) {
		value = replaceLastToken(value, suggestion.insert);
		if (suggestion.complete) commit();
	}

	function toggle(index: number) {
		rules = rules.map((rule, i) => (i === index ? { ...rule, negate: !rule.negate } : rule));
	}

	function remove(index: number) {
		rules = rules.filter((_, i) => i !== index);
	}

	function onkeydown(event: KeyboardEvent) {
		const count = suggestions.length;
		if (event.key === 'ArrowDown' && count > 0) {
			event.preventDefault();
			highlight = (highlight + 1) % count;
		} else if (event.key === 'ArrowUp' && count > 0) {
			event.preventDefault();
			highlight = highlight <= 0 ? count - 1 : highlight - 1;
		} else if (event.key === 'Enter') {
			event.preventDefault();
			if (highlight >= 0 && highlight < count) pick(suggestions[highlight]);
			else commit();
		} else if (event.key === 'Tab' && !event.shiftKey && count > 0 && lastToken) {
			event.preventDefault();
			pick(suggestions[Math.max(highlight, 0)]);
		} else if (event.key === 'Escape' && showDropdown) {
			// The popup keeps suggestions open, so Escape there still closes it.
			event.preventDefault();
			dismissedAt = value;
		} else if (event.key === 'Backspace' && value === '' && rules.length > 0) {
			event.preventDefault();
			remove(rules.length - 1);
		}
	}

	function onfocusin(event: FocusEvent) {
		focused = event.target instanceof HTMLInputElement;
		if (focused) dismissedAt = null;
	}
</script>

{#snippet badges()}
	{#each rules as rule, i (i)}
		<Tooltip text="Click to invert">
			<Badge color={rule.negate ? 'danger' : 'neutral'}>
				<button
					type="button"
					class="cursor-pointer"
					aria-pressed={rule.negate}
					onclick={() => toggle(i)}>
					{describeRule(rule, fields)}
				</button>
				<button
					type="button"
					aria-label="Remove rule"
					class="-mr-0.5 cursor-pointer opacity-60 transition-opacity hover:opacity-100"
					onclick={() => remove(i)}>
					<X size={12} />
				</button>
			</Badge>
		</Tooltip>
	{/each}
{/snippet}

{#snippet suggestionList()}
	<ul
		role="listbox"
		aria-label="Filter suggestions"
		class="p-1">
		{#each suggestions as suggestion, i (suggestion.insert)}
			<li
				role="option"
				aria-selected={i === highlight}>
				<!-- mousedown keeps focus in the field -->
				<button
					type="button"
					class="flex w-full cursor-pointer items-center justify-between gap-4 rounded-control px-3 py-1.5 text-left text-sm {i ===
					highlight
						? 'bg-surface-hover'
						: ''}"
					onmousedown={(event) => event.preventDefault()}
					onmousemove={() => (highlight = i)}
					onclick={() => pick(suggestion)}>
					<span class="truncate">{suggestion.label}</span>
					<span class="shrink-0 text-xs text-text-muted">{suggestion.hint}</span>
				</button>
			</li>
		{/each}
	</ul>
{/snippet}

{#snippet hints()}
	<div class="flex items-center gap-4 px-3 py-1.5 text-xs text-text-muted">
		<span class="flex items-center gap-1.5"><Kbd>↑↓</Kbd> select</span>
		<span class="flex items-center gap-1.5"><Kbd>↵</Kbd> add rule</span>
		<span>Click a rule to invert it</span>
	</div>
{/snippet}

{#snippet popupBody()}
	{#if suggestions.length > 0}
		<div class="border-b border-border">
			{@render suggestionList()}
		</div>
	{/if}
	{@render results?.()}
{/snippet}

<div
	bind:this={wrapperEl}
	bind:clientWidth={wrapperWidth}
	class={className}
	{onfocusin}
	onfocusout={() => (focused = false)}>
	<SearchInput
		bind:value
		bind:open
		{placeholder}
		{mode}
		{shortcut}
		{rounded}
		leading={rules.length > 0 ? badges : undefined}
		{append}
		{error}
		{shakes}
		clearable={rules.length > 0}
		onclear={() => (rules = [])}
		{onkeydown}
		results={popupBody}
		footer={hints} />
</div>

{#if showDropdown}
	<Dropdown
		triggerEl={wrapperEl}
		placement="bottom"
		width="{wrapperWidth}px"
		ondismiss={() => (dismissedAt = value)}>
		{@render suggestionList()}
		<div class="border-t border-border">
			{@render hints()}
		</div>
	</Dropdown>
{/if}

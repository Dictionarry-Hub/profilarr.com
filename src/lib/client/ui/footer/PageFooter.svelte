<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import Card from '$lib/client/ui/card/Card.svelte';
	import type { DocLink } from '$lib/shared/utils/llm/docs.js';

	interface Props {
		links: DocLink[];
	}

	let { links }: Props = $props();
</script>

<!-- The label is not a heading, so the table of contents leaves it out. -->
{#if links.length > 0}
	<footer class="mt-12">
		<div class="mb-3 flex items-center gap-3">
			<p class="text-sm font-semibold text-text-muted">Next</p>
			<span class="h-px flex-1 bg-border-muted"></span>
		</div>
		<div class="grid gap-3 sm:grid-cols-2">
			{#each links as link (link.href)}
				<Card
					as="a"
					href={link.href}
					class="group h-full transition-colors hover:bg-surface-hover">
					<div class="flex flex-1 gap-3">
						<div class="min-w-0 flex-1">
							<span
								class="block font-medium text-text transition-colors group-hover:text-link-text">
								{link.title}
							</span>
							{#if link.blurb}
								<span class="mt-1 block text-xs text-text-soft">{link.blurb}</span>
							{/if}
						</div>
						<ArrowRight
							class="size-4 shrink-0 self-center text-text-muted transition-transform group-hover:translate-x-0.5" />
					</div>
				</Card>
			{/each}
		</div>
	</footer>
{/if}

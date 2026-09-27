<script lang="ts">
	import { File, Folder } from '@lucide/svelte';
	import type { TreeNode } from '$lib/shared/utils/llm/components.js';

	interface Props {
		items: TreeNode[];
	}

	let { items }: Props = $props();
</script>

<!-- Divs with list roles rather than ul/li, so the prose list styles
     (bullets, indents, margins) don't apply inside docs pages. -->
{#snippet nodes(list: TreeNode[])}
	<div
		role="list"
		class="flex flex-col gap-1.5">
		{#each list as node (node.name)}
			<div role="listitem">
				<div class="flex items-center gap-2">
					{#if node.children}
						<Folder
							size={14}
							class="shrink-0 text-text-muted" />
					{:else}
						<File
							size={14}
							class="shrink-0 text-text-muted" />
					{/if}
					<span class="font-mono text-sm">{node.name}{node.children ? '/' : ''}</span>
					{#if node.note}
						<span class="text-sm text-text-muted">{node.note}</span>
					{/if}
				</div>
				{#if node.children && node.children.length > 0}
					<div class="mt-1.5 ml-[7px] border-l border-border-muted pl-4">
						{@render nodes(node.children)}
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/snippet}

<div class="mb-5 rounded-card border border-border bg-surface-muted px-4 py-3">
	{@render nodes(items)}
</div>

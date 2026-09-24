<script lang="ts">
	import { Icon, type LucideProps } from '@lucide/svelte';
	import { astronautHelmet } from '@lucide/lab';

	let props: LucideProps = $props();
</script>

<Icon
	iconNode={astronautHelmet}
	{...props} />

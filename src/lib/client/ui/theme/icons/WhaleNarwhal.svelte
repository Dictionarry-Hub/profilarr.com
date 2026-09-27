<script lang="ts">
	import { Icon, type LucideProps } from '@lucide/svelte';
	import { whaleNarwhal } from '@lucide/lab';

	let props: LucideProps = $props();
</script>

<Icon
	iconNode={whaleNarwhal}
	{...props} />

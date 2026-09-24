<script lang="ts">
	import { Icon, type LucideProps } from '@lucide/svelte';
	import { ufo } from '@lucide/lab';

	let props: LucideProps = $props();
</script>

<Icon
	iconNode={ufo}
	{...props} />

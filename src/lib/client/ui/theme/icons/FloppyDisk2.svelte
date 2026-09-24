<script lang="ts">
	import { Icon, type LucideProps } from '@lucide/svelte';
	import { floppyDisk2 } from '@lucide/lab';

	let props: LucideProps = $props();
</script>

<Icon
	iconNode={floppyDisk2}
	{...props} />

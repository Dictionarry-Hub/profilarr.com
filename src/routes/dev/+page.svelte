<script lang="ts">
	import SEO from '$lib/client/ui/utils/SEO.svelte';
</script>

<SEO
	title="Dev"
	description="Development tools for this site." />

<!-- Index for the dev-only sidebar group, so its header link has a page. -->
<div class="prose">
	<h1>Dev</h1>
	<p>
		Development tools for this site. The sidebar only shows this section in development builds.
	</p>
	<ul>
		<li><a href="/dev/ui">UI Showcase</a>: the shared components and their states.</li>
		<!-- The error previews respond with their error status, so production
		     prerendering would treat these links as broken. -->
		{#if import.meta.env.DEV}
			<li>
				Error pages: <a href="/dev/errors/404">404</a>, <a href="/dev/errors/403">403</a>,
				and <a href="/dev/errors/500">500</a>.
			</li>
		{/if}
	</ul>
</div>

<script lang="ts">
	import home from '../../content/pages/home.json';
	import { marked } from 'marked';

	const bodyHtml = marked.parse(home.body) as string;
</script>

<h1>{home.title}</h1>
<!-- eslint-disable-next-line svelte/no-at-html-tags -->
<div class="prose">{@html bodyHtml}</div>
<p>
	<a href="/admin/">Open Decap CMS</a> (run <code>npm run cms</code> alongside <code>npm run dev</code>).
</p>

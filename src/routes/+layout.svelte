<script lang="ts">
    import { onMount } from "svelte";
    import "../reset.css";
    import "../app.css";
    import { getRandomCompetenceFavicon } from "$lib/favicon";
    import Navigation from "$lib/components/Navigation.svelte";
    import Footer from "$lib/components/Footer.svelte";

    let { children } = $props();
    let favicon = $state<string | undefined>(undefined);

    onMount(() => {
        favicon = getRandomCompetenceFavicon();
    });
</script>

<svelte:head>
    {#if favicon}
        <link rel="icon" href={favicon} />
    {/if}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossorigin="anonymous"
    />
    <link
        href="https://fonts.googleapis.com/css2?family=Intel+One+Mono:wght@400&family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<div class="page-foreground">
    <Navigation />

    {@render children()}
</div>
<Footer />

<style>
    .page-foreground {
        padding: 30px;
        /* position: relative; */
        z-index: 1;
        overflow: hidden;
    }
</style>

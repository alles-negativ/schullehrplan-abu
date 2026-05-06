<script lang="ts">
    import "../app.css";
    import favicon from "$lib/assets/favicon.svg";
    import Navigation from "$lib/components/Navigation.svelte";

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<div class="page-foreground">
    <Navigation />

    {@render children()}
</div>

<style>
    .page-foreground {
        position: relative;
        z-index: 1;
    }
</style>

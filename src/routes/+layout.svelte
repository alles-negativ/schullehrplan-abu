<script lang="ts">
    import "../reset.css";
    import "../app.css";
    import favicon from "$lib/assets/favicon.svg";
    import Navigation from "$lib/components/Navigation.svelte";
    import Footer from "$lib/components/Footer.svelte";

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
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
        margin: 30px;
        /* position: relative; */
        z-index: 1;
    }
</style>

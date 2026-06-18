<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { onMount } from "svelte";
    import "../reset.css";
    import "../app.css";
    import { getRandomCompetenceFavicon } from "$lib/favicon";
    import Navigation from "$lib/components/Navigation.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import {
        isMobileViewport,
        watchMobileViewport,
    } from "$lib/mobile-view";

    let { children } = $props();
    let favicon = $state<string | undefined>(
        browser ? getRandomCompetenceFavicon() : undefined,
    );
    let viewportReady = $state(false);
    let isMobile = $state(false);

    onMount(() => {
        isMobile = isMobileViewport();
        viewportReady = true;

        return watchMobileViewport((mobile) => {
            isMobile = mobile;
        });
    });

    $effect(() => {
        if (!viewportReady || !isMobile) return;
        if (page.url.pathname !== "/") {
            void goto("/", { replaceState: true });
        }
    });
</script>

<svelte:head>
    {#if favicon}
        <link rel="icon" type="image/png" href={favicon} />
        <link rel="apple-touch-icon" href={favicon} />
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

{#if viewportReady}
    <div class="page-foreground" class:is-mobile={isMobile}>
        {#if !isMobile}
            <Navigation />
        {/if}

        {#if !isMobile || page.url.pathname === "/"}
            {@render children()}
        {/if}
    </div>
    {#if !isMobile}
        <Footer />
    {/if}
{/if}

<style>
    .page-foreground {
        padding: 30px;
        z-index: 1;
        overflow: hidden;
    }

    .page-foreground.is-mobile {
        padding: 0;
        overflow: visible;
    }
</style>

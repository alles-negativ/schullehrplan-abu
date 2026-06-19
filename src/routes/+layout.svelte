<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { onMount } from "svelte";
    import "../reset.css";
    import "../app.css";
    import { pickRandomCompetenceColor } from "$lib/competence-colors";
    import { getRandomCompetenceFaviconHrefs } from "$lib/favicon";
    import Navigation from "$lib/components/Navigation.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import StickyPdfLink from "$lib/components/StickyPdfLink.svelte";
    import {
        isMobileViewport,
        watchMobileViewport,
    } from "$lib/mobile-view";

    const SELECTION_ROTATE_MS = 5000;

    let { children } = $props();
    let favicon = $state("/favicon.png");
    let appleTouchIcon = $state("/apple-touch-icon.png");
    let viewportReady = $state(false);
    let isMobile = $state(false);

    onMount(() => {
        isMobile = isMobileViewport();
        viewportReady = true;

        const randomFavicon = getRandomCompetenceFaviconHrefs();
        favicon = randomFavicon.icon;
        appleTouchIcon = randomFavicon.appleTouchIcon;

        let currentSelection = pickRandomCompetenceColor();
        document.documentElement.style.setProperty(
            "--color-selection",
            currentSelection,
        );

        const selectionInterval = window.setInterval(() => {
            currentSelection = pickRandomCompetenceColor(currentSelection);
            document.documentElement.style.setProperty(
                "--color-selection",
                currentSelection,
            );
        }, SELECTION_ROTATE_MS);

        const stopViewportWatch = watchMobileViewport((mobile) => {
            isMobile = mobile;
        });

        return () => {
            clearInterval(selectionInterval);
            stopViewportWatch();
        };
    });

    $effect(() => {
        if (!viewportReady || !isMobile) return;
        if (page.url.pathname !== "/") {
            void goto("/", { replaceState: true });
        }
    });
</script>

<svelte:head>
    <link rel="icon" type="image/png" sizes="32x32" href={favicon} />
    <link rel="apple-touch-icon" sizes="180x180" href={appleTouchIcon} />
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
        {#if page.url.pathname === "/"}
            <div class="footer-gap">
                <StickyPdfLink
                    href="/uploads/5_SLP_Einleitung_allg.Teil_20260512.pdf"
                    label="Rahmenlehrplan"
                />
            </div>
        {/if}
        <Footer />
    {/if}
{/if}

<style>
    .page-foreground {
        padding: calc(30 * var(--u));
        z-index: 1;
        overflow: hidden;
    }

    .page-foreground.is-mobile {
        padding: 0;
        overflow: visible;
    }

    .footer-gap {
        position: relative;
        height: calc(200 * var(--u));
    }
</style>

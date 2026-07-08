<script lang="ts">
    import { onMount } from "svelte";
    import { pickRandomCompetenceColor } from "$lib/competence-colors";

    let { status } = $props<{
        error: App.Error;
        status: number;
    }>();

    let cardColor = $state("#87E8F7");

    onMount(() => {
        cardColor = pickRandomCompetenceColor();
    });
</script>

<svelte:head>
    <title>404 - Fehler</title>
</svelte:head>

<main class="error-page">
    <section class="error-content">
        <h1>Oje, diese Seite ist verschwunden!</h1>
        <p>
            Wir haben wirklich überall gesucht, aber leider ohne Erfolg. Keine
            Sorge, wir finden gemeinsam den richtigen Ort für dich.
        </p>
        <a class="home-button" href="/">Zur Startseite</a>
    </section>
</main>

<style>
    .error-page {
        min-height: calc(100vh - calc(60 * var(--u)));
        display: grid;
        place-items: center;
        padding: calc(30 * var(--u));
        box-sizing: border-box;
        text-align: center;
    }

    .error-content {
        width: min(calc(840 * var(--u)), 100%);
        display: grid;
        gap: calc(24 * var(--u));
        justify-items: center;
    }

    h1 {
        margin: 0;
        font-size: clamp(calc(42 * var(--u)), 7vw, calc(86 * var(--u)));
        line-height: 1.05;
        letter-spacing: -0.02em;
        max-width: min(calc(760 * var(--u)), 100%);
    }

    p {
        margin: 0;
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
        max-width: min(calc(780 * var(--u)), 100%);
        text-align: center;
    }

    .home-button {
        margin-top: calc(12 * var(--u));
        display: inline-block;
        max-height: calc(55 * var(--u));
        padding: calc(7 * var(--u)) calc(25 * var(--u));
        border: calc(1.5 * var(--u)) solid var(--color-black);
        border-radius: 9999px;
        background: var(--color-white);
        color: var(--color-black);
        text-decoration: none;
        font-size: calc(32 * var(--u));
        line-height: calc(40 * var(--u));
        font-weight: 300;
        letter-spacing: 0.01em;
        white-space: nowrap;
        text-align: center;
        transition:
            background-color 120ms ease,
            border-color 120ms ease,
            color 120ms ease,
            transform 60ms ease,
            filter 60ms ease;
    }

    .home-button:hover {
        background: var(--color-darkblue);
        color: var(--color-white);
    }

    .home-button:active {
        filter: brightness(1.2);
    }
</style>

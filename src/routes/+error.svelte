<script lang="ts">
    import { onMount } from "svelte";
    import {
        getCompetenceColors,
        pickRandomCompetenceColor,
    } from "$lib/competence-colors";

    let { status } = $props<{
        error: App.Error;
        status: number;
    }>();

    let cardColor = $state("#87E8F7");
    let sparks = $state<
        Array<{
            id: number;
            x: number;
            y: number;
            size: number;
            color: string;
            drift: number;
            durationMs: number;
        }>
    >([]);

    onMount(() => {
        cardColor = pickRandomCompetenceColor();
        const colors = getCompetenceColors();
        let sparkId = 0;
        let lastX = -1;
        let lastY = -1;
        let lastEmitAt = 0;
        const MAX_SPARKS = 90;

        const emitSparks = (x: number, y: number) => {
            for (let i = 0; i < 3; i += 1) {
                const durationMs = 650 + Math.floor(Math.random() * 500);
                const spark = {
                    id: sparkId++,
                    x: x + (Math.random() - 0.5) * 18,
                    y: y + (Math.random() - 0.5) * 12,
                    size: 10 + Math.random() * 16,
                    color:
                        colors[Math.floor(Math.random() * colors.length)] ??
                        "#87E8F7",
                    drift: (Math.random() - 0.5) * 34,
                    durationMs,
                };
                sparks = [...sparks.slice(-MAX_SPARKS), spark];
                window.setTimeout(() => {
                    sparks = sparks.filter((item) => item.id !== spark.id);
                }, durationMs + 120);
            }
        };

        const onMouseMove = (event: MouseEvent) => {
            const now = performance.now();
            const dx = event.clientX - lastX;
            const dy = event.clientY - lastY;
            const movedEnough = Math.hypot(dx, dy) > 10;
            const cooledDown = now - lastEmitAt > 22;
            if (!movedEnough || !cooledDown) return;
            lastX = event.clientX;
            lastY = event.clientY;
            lastEmitAt = now;
            emitSparks(event.clientX, event.clientY);
        };

        window.addEventListener("mousemove", onMouseMove, { passive: true });

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            sparks = [];
        };
    });
</script>

<svelte:head>
    <title>404 - Fehler</title>
</svelte:head>

<main class="error-page">
    <div class="spark-layer" aria-hidden="true">
        {#each sparks as spark (spark.id)}
            <span
                class="spark"
                style={`
                    --spark-x: ${spark.x}px;
                    --spark-y: ${spark.y}px;
                    --spark-size: ${spark.size}px;
                    --spark-color: ${spark.color};
                    --spark-drift: ${spark.drift}px;
                    --spark-duration: ${spark.durationMs}ms;
                `}
            ></span>
        {/each}
    </div>

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
    .spark-layer {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 3;
        overflow: hidden;
    }

    .spark {
        position: absolute;
        left: 0;
        top: 0;
        width: var(--spark-size);
        height: var(--spark-size);
        border-radius: 9999px;
        background: var(--spark-color);
        transform: translate(var(--spark-x), var(--spark-y));
        animation: spark-fall var(--spark-duration) ease-out forwards;
        will-change: transform, opacity;
    }

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
        font-weight: 400;
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

    @keyframes spark-fall {
        0% {
            opacity: 0.95;
            transform: translate(var(--spark-x), var(--spark-y)) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(
                    calc(var(--spark-x) + var(--spark-drift)),
                    calc(var(--spark-y) + 58px)
                )
                scale(0.7);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .spark-layer {
            display: none;
        }
    }
</style>

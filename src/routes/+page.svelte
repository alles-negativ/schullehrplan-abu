<script lang="ts">
    import { onMount } from "svelte";
    import InteractivePhysics from "$lib/components/InteractivePhysics.svelte";
    import MobileExperience from "$lib/components/MobileExperience.svelte";
    import TopicMap from "$lib/components/TopicMap.svelte";
    import {
        getAllCompetences,
        getAspectByTitle,
        type Competence,
    } from "$lib/data/education-modes";
    import { isMobileViewport } from "$lib/mobile-view";

    let { data } = $props();

    const aspectOrder = [
        "Gesellschaftliche Inhalte",
        "Sprachmodi",
        "Schlüsselkompetenzen",
    ] as const;

    type FallingCompetence = Competence & { id: string };

    const INTRO_SCROLL_THRESHOLD = 80;
    const INITIAL_DROP_DELAY_MS = 1400;
    const SCROLL_HINT_IDLE_MS = 30_000;
    const SCROLL_HINT_DELTA_PX = 24;
    const SCROLL_HINT_IMPULSE_MS = 160;
    const SCROLL_HINT_GAP_MS = 320;

    let fallingCompetences = $state<FallingCompetence[]>([]);
    let selectedAspect = $state<(typeof aspectOrder)[number] | null>(null);
    let pillDragging = $state(false);
    let isMobile = $state(false);
    let viewportReady = $state(false);
    let introVisible = $state(true);
    let heroShakeKey = $state(0);
    let nextPillId = 0;
    let initialDropTimeout: ReturnType<typeof setTimeout> | null = null;
    let scrollHintIdleTimer: ReturnType<typeof setTimeout> | null = null;
    let scrollHintPlaying = false;
    let scrollHintGeneration = 0;

    const pickFromAspect = (
        aspect: (typeof aspectOrder)[number],
        count: number,
    ) => {
        const pool = getAllCompetences().filter(
            (competence) => competence.aspect === aspect,
        );
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, Math.min(count, pool.length));

        fallingCompetences = [
            ...fallingCompetences,
            ...picked.map((competence) => ({
                ...competence,
                id: `pill-${nextPillId++}`,
            })),
        ];
    };

    const pickRandomAspect = (
        exclude?: (typeof aspectOrder)[number] | null,
    ) => {
        const pool = exclude
            ? aspectOrder.filter((aspect) => aspect !== exclude)
            : aspectOrder;
        return pool[Math.floor(Math.random() * pool.length)];
    };

    const clearInitialDropTimeout = () => {
        if (initialDropTimeout) {
            clearTimeout(initialDropTimeout);
            initialDropTimeout = null;
        }
    };

    const scheduleInitialDrop = (withShake = false) => {
        clearInitialDropTimeout();
        const aspect = pickRandomAspect();
        selectedAspect = aspect;
        if (withShake) heroShakeKey += 1;
        initialDropTimeout = setTimeout(() => {
            pickFromAspect(aspect, 4 + Math.floor(Math.random() * 3));
            initialDropTimeout = null;
        }, INITIAL_DROP_DELAY_MS);
    };

    const handlePillsVanished = () => {
        fallingCompetences = [];
        if (introVisible) {
            scheduleInitialDrop(true);
        }
    };

    const updateIntroVisibility = () => {
        const atTop = window.scrollY < INTRO_SCROLL_THRESHOLD;
        if (atTop === introVisible) return;

        introVisible = atTop;

        if (!atTop) {
            clearInitialDropTimeout();
            clearScrollHintIdleTimer();
            cancelScrollHint();
        } else if (!fallingCompetences.length) {
            scheduleInitialDrop(true);
            armScrollHintTimer();
        }
    };

    const clearScrollHintIdleTimer = () => {
        if (scrollHintIdleTimer) {
            clearTimeout(scrollHintIdleTimer);
            scrollHintIdleTimer = null;
        }
    };

    const cancelScrollHint = () => {
        scrollHintGeneration += 1;
        scrollHintPlaying = false;
    };

    const armScrollHintTimer = () => {
        clearScrollHintIdleTimer();
        scrollHintIdleTimer = setTimeout(() => {
            scrollHintIdleTimer = null;
            void playScrollHint();
        }, SCROLL_HINT_IDLE_MS);
    };

    const resetScrollHintIdle = () => {
        if (scrollHintPlaying) cancelScrollHint();
        armScrollHintTimer();
    };

    const pauseScrollHint = (ms: number, generation: number) =>
        new Promise<void>((resolve) => {
            setTimeout(() => {
                if (generation === scrollHintGeneration) resolve();
            }, ms);
        });

    const animateScrollY = (
        targetY: number,
        durationMs: number,
        generation: number,
    ) =>
        new Promise<void>((resolve) => {
            if (generation !== scrollHintGeneration) {
                resolve();
                return;
            }

            const startY = window.scrollY;
            const delta = targetY - startY;
            if (delta === 0 || durationMs <= 0) {
                window.scrollTo(0, targetY);
                resolve();
                return;
            }

            const start = performance.now();
            const step = (now: number) => {
                if (generation !== scrollHintGeneration) {
                    resolve();
                    return;
                }

                const progress = Math.min((now - start) / durationMs, 1);
                const eased = 1 - (1 - progress) ** 2;
                window.scrollTo(0, startY + delta * eased);

                if (progress < 1) requestAnimationFrame(step);
                else resolve();
            };

            requestAnimationFrame(step);
        });

    const playScrollHintImpulse = async (
        startY: number,
        generation: number,
    ) => {
        await animateScrollY(
            startY + SCROLL_HINT_DELTA_PX,
            SCROLL_HINT_IMPULSE_MS,
            generation,
        );
        if (generation !== scrollHintGeneration) return;
        await animateScrollY(startY, SCROLL_HINT_IMPULSE_MS, generation);
    };

    const playScrollHint = async () => {
        if (
            scrollHintPlaying ||
            !introVisible ||
            window.scrollY >= INTRO_SCROLL_THRESHOLD ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            armScrollHintTimer();
            return;
        }

        const generation = scrollHintGeneration;
        scrollHintPlaying = true;
        const startY = window.scrollY;

        try {
            await playScrollHintImpulse(startY, generation);
            if (generation !== scrollHintGeneration) return;
            await pauseScrollHint(SCROLL_HINT_GAP_MS, generation);
            if (generation !== scrollHintGeneration) return;
            await playScrollHintImpulse(startY, generation);
        } finally {
            if (generation === scrollHintGeneration) {
                scrollHintPlaying = false;
                armScrollHintTimer();
            }
        }
    };

    const isScrollKey = (event: KeyboardEvent) => {
        const { key, code } = event;
        return (
            key === "ArrowDown" ||
            key === "ArrowUp" ||
            key === "PageDown" ||
            key === "PageUp" ||
            key === " " ||
            key === "Home" ||
            key === "End" ||
            code === "Space"
        );
    };

    const addMoreCompetences = () => {
        if (!introVisible) return;
        const aspect = pickRandomAspect(selectedAspect);
        selectedAspect = aspect;
        pickFromAspect(aspect, 2 + Math.floor(Math.random() * 3));
    };

    const aspectColor = $derived(
        selectedAspect
            ? (getAspectByTitle(selectedAspect)?.color ?? "#FF9193")
            : "#FF9193",
    );

    onMount(() => {
        isMobile = isMobileViewport();
        viewportReady = true;

        if (isMobile) return;

        scheduleInitialDrop();
        armScrollHintTimer();

        const onScroll = () => {
            if (!scrollHintPlaying) armScrollHintTimer();
            requestAnimationFrame(updateIntroVisibility);
        };
        const onScrollIntent = () => resetScrollHintIdle();
        const onKeyDown = (event: KeyboardEvent) => {
            if (isScrollKey(event)) onScrollIntent();
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("wheel", onScrollIntent, { passive: true });
        window.addEventListener("touchstart", onScrollIntent, {
            passive: true,
        });
        window.addEventListener("keydown", onKeyDown);

        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("wheel", onScrollIntent);
            window.removeEventListener("touchstart", onScrollIntent);
            window.removeEventListener("keydown", onKeyDown);
            clearInitialDropTimeout();
            clearScrollHintIdleTimer();
            cancelScrollHint();
        };
    });
</script>

<svelte:head>
    <title>Schullehrplan ABU</title>
</svelte:head>

{#if viewportReady}
    {#if isMobile}
        <MobileExperience mobile={data.mobile} />
    {:else}
        <main class="start-page">
            <section class="intro-stage" aria-label="Willkommen">
                <div class="hero">
                    <p class="hero-text">
                        Ich bin der neue Schullehrplan Allgemeinbildung.
                        <br />
                        Lernen ist bei mir kompetenzorientiert, vernetzt und aufbauend.
                    </p>
                    {#if selectedAspect}
                        {#key heroShakeKey}
                            <button
                                type="button"
                                class="hero-button"
                                style={`--button-color: ${aspectColor}`}
                                disabled={pillDragging}
                                onclick={addMoreCompetences}
                            >
                                {#if selectedAspect === "Schlüsselkompetenzen"}
                                    Schlüssel-kompetenzen
                                {:else}
                                    {selectedAspect}
                                {/if}
                            </button>
                        {/key}
                    {/if}
                </div>

                <InteractivePhysics
                    competences={fallingCompetences}
                    bind:dragging={pillDragging}
                    active={introVisible}
                    onVanished={handlePillsVanished}
                />
            </section>

            <TopicMap />
        </main>
    {/if}
{/if}

<style>
    .start-page {
        /* Pill measurement metrics consumed by InteractivePhysics. */
        --pill-max-width: calc(550 * var(--u));
        --pill-h-padding: calc(76 * var(--u));
        --pill-min-content: calc(200 * var(--u));

        display: flex;
        flex-direction: column;
        gap: calc(64 * var(--u));
    }

    .intro-stage {
        /* position: relative; */
        min-height: calc(100vh - 120px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        /* padding: 2rem 0 4rem; */
        top: 0;
        position: relative;
        top: 0px;
        height: 100vh;
    }

    .hero {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: calc(32 * var(--u));
        max-width: 80%;
        text-align: center;
        pointer-events: none;
        top: calc(-85 * var(--u));
    }

    /*
     * Below 1728px the hero stays fluid between a minimum and its authored
     * size (`clamp`); the upper bound is `calc(50 * var(--u))`, which equals
     * 50px until 1728px and then scales up linearly with the viewport.
     */
    .hero-text {
        position: relative;
        z-index: 1;
        font-size: clamp(28px, 3.47vw, calc(50 * var(--u)));
        line-height: 120%;
        font-weight: var(--h1-weight);
        letter-spacing: var(--h1-letter-spacing);
        text-wrap: balance;
        text-align: center;
    }

    .hero-button {
        position: relative;
        z-index: 3;
        pointer-events: auto;
        padding: clamp(20px, 3.47vw, calc(50 * var(--u)))
            clamp(32px, 6.94vw, calc(100 * var(--u)));
        border: clamp(2px, 0.21vw, calc(3 * var(--u))) solid var(--color-black);
        border-radius: 9999px;
        background: var(--button-color);
        box-shadow: 0 clamp(6px, 0.83vw, calc(12 * var(--u)))
            clamp(16px, 2.08vw, calc(30 * var(--u))) rgba(0, 0, 0, 0.25);
        color: var(--color-black);
        font-size: clamp(24px, 3.47vw, calc(50 * var(--u)));
        line-height: 1.12;
        font-weight: 300;
        letter-spacing: var(--h2-letter-spacing);
        cursor: pointer;
        transition:
            background-color 160ms ease,
            filter 160ms ease;
        width: clamp(280px, 41.67vw, calc(600 * var(--u)));
        height: clamp(112px, 16.67vw, calc(240 * var(--u)));
        white-space: pre-line;
        animation: hero-shake-hack 1.2s 0.5s;
    }

    .hero-button:hover:not(:disabled) {
        filter: brightness(1.1);
        animation: hero-shake-loop 1.2s 0s infinite;
    }

    .hero-button:active:not(:disabled) {
        animation: none;
    }

    @keyframes hero-shake-loop {
        0%,
        50%,
        100% {
            transform: rotate(0deg) translateX(0);
        }
        10% {
            transform: rotate(-1deg) translateX(calc(-10 * var(--u)));
        }
        20% {
            transform: rotate(1deg) translateX(calc(10 * var(--u)));
        }
        30% {
            transform: rotate(-0.75deg) translateX(calc(-10 * var(--u)));
        }
        40% {
            transform: rotate(0.75deg) translateX(calc(10 * var(--u)));
        }
    }

    @keyframes hero-shake-hack {
        0%,
        50%,
        100% {
            transform: rotate(0deg) translateX(0);
        }
        10% {
            transform: rotate(-1deg) translateX(calc(-10 * var(--u)));
        }
        20% {
            transform: rotate(1deg) translateX(calc(10 * var(--u)));
        }
        30% {
            transform: rotate(-0.75deg) translateX(calc(-10 * var(--u)));
        }
        40% {
            transform: rotate(0.75deg) translateX(calc(10 * var(--u)));
        }
    }

    @keyframes hero-shake {
        0%,
        18%,
        100% {
            transform: rotate(0deg) translateX(0);
        }
        3% {
            transform: rotate(-1deg) translateX(calc(-10 * var(--u)));
        }
        6% {
            transform: rotate(1deg) translateX(calc(10 * var(--u)));
        }
        9% {
            transform: rotate(-0.75deg) translateX(calc(-10 * var(--u)));
        }
        12% {
            transform: rotate(0.75deg) translateX(calc(10 * var(--u)));
        }
        15% {
            transform: rotate(0deg) translateX(0);
        }
    }

    .hero-button:disabled {
        pointer-events: none;
        cursor: default;
    }
</style>

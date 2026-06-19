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

    const aspectOrder = [
        "Gesellschaftliche Inhalte",
        "Sprachmodi",
        "Schlüsselkompetenzen",
    ] as const;

    type FallingCompetence = Competence & { id: string };

    let fallingCompetences = $state<FallingCompetence[]>([]);
    let selectedAspect = $state<(typeof aspectOrder)[number] | null>(null);
    let pillDragging = $state(false);
    let isMobile = $state(false);
    let viewportReady = $state(false);
    let nextPillId = 0;

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

    const addMoreCompetences = () => {
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

        const aspect = pickRandomAspect();
        selectedAspect = aspect;

        const timeout = setTimeout(() => {
            pickFromAspect(aspect, 4 + Math.floor(Math.random() * 3));
        }, 1400);
        return () => clearTimeout(timeout);
    });
</script>

<svelte:head>
    <title>Schullehrplan ABU</title>
</svelte:head>

{#if viewportReady}
    {#if isMobile}
        <MobileExperience />
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
                    {/if}
                </div>

                <InteractivePhysics
                    competences={fallingCompetences}
                    bind:dragging={pillDragging}
                />
            </section>

            <TopicMap />
        </main>
    {/if}
{/if}

<style>
    .start-page {
        display: flex;
        flex-direction: column;
        gap: 4rem;
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
        gap: 2rem;
        max-width: 80%;
        text-align: center;
        pointer-events: none;
        top: -85px;
    }

    .hero-text {
        position: relative;
        z-index: 1;
        font-size: clamp(28px, 3.47vw, 50px);
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
        padding: clamp(20px, 3.47vw, 50px) clamp(32px, 6.94vw, 100px);
        border: clamp(2px, 0.21vw, 3px) solid var(--color-black);
        border-radius: 9999px;
        background: var(--button-color);
        box-shadow: 0 clamp(6px, 0.83vw, 12px) clamp(16px, 2.08vw, 30px)
            rgba(0, 0, 0, 0.25);
        color: var(--color-black);
        font-size: clamp(24px, 3.47vw, 50px);
        line-height: 1.12;
        font-weight: 300;
        letter-spacing: var(--h2-letter-spacing);
        cursor: pointer;
        transition:
            background-color 160ms ease,
            filter 160ms ease;
        width: clamp(280px, 41.67vw, 600px);
        height: clamp(112px, 16.67vw, 240px);
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
            transform: rotate(-1deg) translateX(-10px);
        }
        20% {
            transform: rotate(1deg) translateX(10px);
        }
        30% {
            transform: rotate(-0.75deg) translateX(-10px);
        }
        40% {
            transform: rotate(0.75deg) translateX(10px);
        }
    }

    @keyframes hero-shake-hack {
        0%,
        50%,
        100% {
            transform: rotate(0deg) translateX(0);
        }
        10% {
            transform: rotate(-1deg) translateX(-10px);
        }
        20% {
            transform: rotate(1deg) translateX(10px);
        }
        30% {
            transform: rotate(-0.75deg) translateX(-10px);
        }
        40% {
            transform: rotate(0.75deg) translateX(10px);
        }
    }

    @keyframes hero-shake {
        0%,
        18%,
        100% {
            transform: rotate(0deg) translateX(0);
        }
        3% {
            transform: rotate(-1deg) translateX(-10px);
        }
        6% {
            transform: rotate(1deg) translateX(10px);
        }
        9% {
            transform: rotate(-0.75deg) translateX(-10px);
        }
        12% {
            transform: rotate(0.75deg) translateX(10px);
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

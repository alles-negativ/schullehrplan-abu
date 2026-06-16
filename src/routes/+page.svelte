<script lang="ts">
    import { onMount } from "svelte";
    import InteractivePhysics from "$lib/components/InteractivePhysics.svelte";
    import TopicMap from "$lib/components/TopicMap.svelte";
    import {
        getAllCompetences,
        getAspectByTitle,
        type Competence,
    } from "$lib/data/education-modes";

    const aspectOrder = [
        "Gesellschaftliche Inhalte",
        "Sprachmodi",
        "Schlüsselkompetenzen",
    ] as const;

    type FallingCompetence = Competence & { id: string };

    let fallingCompetences = $state<FallingCompetence[]>([]);
    let selectedAspect = $state<(typeof aspectOrder)[number] | null>(null);
    let pillDragging = $state(false);
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
        const aspect = pickRandomAspect();
        selectedAspect = aspect;

        const timeout = setTimeout(() => {
            pickFromAspect(aspect, 5 + Math.floor(Math.random() * 4));
        }, 1400);
        return () => clearTimeout(timeout);
    });
</script>

<svelte:head>
    <title>Schullehrplan ABU</title>
</svelte:head>

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
        font-size: 50px;
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
        padding: 50px 100px;
        border: 3px solid var(--color-black);
        border-radius: 9999px;
        background: var(--button-color);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
        color: var(--color-black);
        font-size: 50px;
        line-height: 56px;
        font-weight: 300;
        letter-spacing: var(--h2-letter-spacing);
        cursor: pointer;
        transition:
            background-color 160ms ease,
            filter 160ms ease;
        width: 600px;
        height: 240px;
        white-space: pre-line;
        animation: hero-shake 3s ease-in-out 0.5s;
    }

    .hero-button:hover:not(:disabled) {
        filter: brightness(1.1);
        animation: hero-shake 3s ease-in-out infinite;
    }

    .hero-button:active:not(:disabled) {
        animation: none;
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

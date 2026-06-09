<script lang="ts">
    import InteractivePhysics from "$lib/components/InteractivePhysics.svelte";
    import {
        getAllCompetences,
        getAspectByTitle,
        type Competence,
    } from "$lib/data/education-modes";

    const aspectOrder = [
        "Gesellschaftliche Aspekte",
        "Sprache und Kommunikation",
        "Schlüsselkompetenzen",
    ] as const;

    const storytellingItems = [
        {
            title: "Themen und Leitidee",
            text: "Acht Themen bilden den roten Faden durch die Ausbildung – von der Leitidee bis zum Qualifikationsverfahren.",
        },
        {
            title: "Kompetenzen",
            text: "Schlüsselkompetenzen, gesellschaftliche Inhalte und Sprache vernetzen sich in jedem Thema miteinander.",
        },
        {
            title: "Sprache",
            text: "Sprache und Kommunikation sind Handlungsformen, die in allen Themen gezielt eingeübt werden.",
        },
        {
            title: "Individueller Lebensbezug",
            text: "Persönliche Erfahrungen und Lebenswelten der Lernenden werden bewusst angebunden.",
        },
        {
            title: "Zirkularität",
            text: "Inhalte und Kompetenzen bauen aufeinander auf und werden im Verlauf der Ausbildung vertieft.",
        },
    ];

    let fallingCompetences = $state<Competence[]>([]);
    let selectedAspect = $state<(typeof aspectOrder)[number] | null>(null);

    const pickRandomCompetences = () => {
        const aspect =
            aspectOrder[Math.floor(Math.random() * aspectOrder.length)];
        const pool = getAllCompetences().filter(
            (competence) => competence.aspect === aspect,
        );
        const count = Math.min(pool.length, 5 + Math.floor(Math.random() * 4));
        const shuffled = [...pool].sort(() => Math.random() - 0.5);

        selectedAspect = aspect;
        fallingCompetences = shuffled.slice(0, count);
    };

    const aspectColor = $derived(
        selectedAspect
            ? (getAspectByTitle(selectedAspect)?.color ?? "#FF9193")
            : "#FF9193",
    );
</script>

<main class="start-page">
    <section class="intro-stage" aria-label="Willkommen">
        <div class="hero">
            <p class="hero-text">
                Ich bin der neue Schullehrplan Allgemeinbildung. Lernen ist bei
                mir kompetenzorientiert, vernetzt und aufbauend.
            </p>
            <button
                type="button"
                class="hero-button"
                style={`--button-color: ${aspectColor}`}
                onclick={pickRandomCompetences}
            >
                {#if selectedAspect}
                    {#if selectedAspect === "Schlüsselkompetenzen"}
                        Schlüssel-kompetenzen
                    {:else}
                        {selectedAspect}
                    {/if}
                {:else}
                    Zufällige Kompetenzen
                {/if}
            </button>
        </div>

        <InteractivePhysics competences={fallingCompetences} />
    </section>

    <section class="storytelling" aria-label="Aufbau des Themen-Schullehrplans">
        <h2 class="storytelling-title">Aufbau des Themen-Schullehrplans</h2>
        <div class="storytelling-grid">
            {#each storytellingItems as item}
                <article class="story-card">
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                </article>
            {/each}
        </div>
    </section>
</main>

<style>
    .start-page {
        display: flex;
        flex-direction: column;
        gap: 4rem;
    }

    .intro-stage {
        position: relative;
        min-height: calc(100vh - 120px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem 0 4rem;
    }

    .hero {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        max-width: 80%;
        text-align: center;
        pointer-events: none;
    }

    .hero-text {
        font-size: 50px;
        line-height: 120%;
        font-weight: var(--h1-weight);
        letter-spacing: var(--h1-letter-spacing);
        text-wrap: balance;
        text-align: center;
    }

    .hero-button {
        pointer-events: auto;
        padding: 50px 100px;
        border: 1.5px solid var(--color-black);
        border-radius: 9999px;
        background: color-mix(in srgb, var(--button-color) 55%, white);
        color: var(--color-black);
        font-size: 50px;
        line-height: 56px;
        font-weight: 300;
        letter-spacing: var(--h2-letter-spacing);
        cursor: pointer;
        transition:
            background-color 160ms ease,
            transform 80ms ease;
        width: 600px;
        height: 240px;
        white-space: pre-line;
    }

    .hero-button:hover {
        background: color-mix(in srgb, var(--button-color) 70%, white);
    }

    .hero-button:active {
        transform: scale(0.98);
    }

    .storytelling {
        padding-bottom: 4rem;
    }

    .storytelling-title {
        margin-bottom: 2rem;
        text-align: center;
    }

    .storytelling-grid {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
    }

    .story-card {
        padding: 1.5rem 1.75rem;
        border-radius: 1.25rem;
        background: var(--color-darkblue);
        color: var(--color-white);
    }

    .story-card h3 {
        margin-bottom: 0.75rem;
        font-size: var(--h3-size);
        line-height: var(--h3-line-height);
        font-weight: var(--h4-weight);
    }

    .story-card p {
        font-size: var(--body-size);
        line-height: var(--body-line-height);
        color: color-mix(in srgb, var(--color-white) 88%, transparent);
    }
</style>

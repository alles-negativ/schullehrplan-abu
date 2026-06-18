<script lang="ts">
    import { onMount } from "svelte";
    import MobileShakePhysics from "$lib/components/MobileShakePhysics.svelte";
    import { getAllCompetences, type Competence } from "$lib/data/education-modes";

    type FallingCompetence = Competence & { id: string };

    let fallingCompetences = $state<FallingCompetence[]>([]);
    let nextPillId = 0;

    onMount(() => {
        const pool = getAllCompetences();
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        const count = 8 + Math.floor(Math.random() * 4);

        fallingCompetences = shuffled.slice(0, count).map((competence) => ({
            ...competence,
            id: `mobile-pill-${nextPillId++}`,
        }));
    });
</script>

<main class="mobile-experience">
    <div class="mobile-hero">
        <p class="mobile-hero-text">
            Ich bin der neue Schullehrplan Allgemeinbildung.
            <br />
            Schüttle dein Gerät und sieh, wie die Kompetenzen reagieren.
        </p>
    </div>

    <div class="physics-area">
        <MobileShakePhysics competences={fallingCompetences} />
    </div>
</main>

<style>
    .mobile-experience {
        position: fixed;
        inset: 0;
        background: var(--color-background);
        overflow: hidden;
    }

    .mobile-hero {
        position: absolute;
        inset: 0;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        pointer-events: none;
    }

    .mobile-hero-text {
        margin: 0;
        max-width: 22rem;
        font-size: 1.25rem;
        line-height: 1.35;
        font-weight: 300;
        letter-spacing: 0.01em;
        text-align: center;
        text-wrap: balance;
    }

    .physics-area {
        position: absolute;
        inset: 0;
        z-index: 2;
    }
</style>
